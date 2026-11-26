import { createHash, randomBytes, randomUUID, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import sharp from 'sharp';
import { database, initialize } from '../lib/database.js';

const deriveKey = promisify(scrypt);
const SESSION_SECONDS = 60 * 60 * 24 * 7;
const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
const hash = value => createHash('sha256').update(value).digest('hex');
const publicProfile = member => ({
  id: member.id, nickname: member.nickname, city: member.city, kind: member.kind, bio: member.bio
});
const fail = (code, status = 400) => Object.assign(new Error(code), { status });

async function passwordHash(password, salt = randomBytes(16).toString('hex')) {
  const key = await deriveKey(password, salt, 64, { N: 131072, r: 8, p: 1, maxmem: 256 * 1024 * 1024 });
  return 'scrypt:131072:8:1:' + salt + ':' + key.toString('hex');
}
async function verifyPassword(password, encoded) {
  const parts = encoded.split(':');
  const modern = parts.length === 6 && parts[0] === 'scrypt';
  const salt = modern ? parts[4] : parts[0];
  const digest = modern ? parts[5] : parts[1];
  const cost = modern ? Number(parts[1]) : 16384;
  if (![16384, 131072].includes(cost) || !/^[a-f0-9]{32}$/.test(salt) || !/^[a-f0-9]{128}$/.test(digest)) return false;
  const key = await deriveKey(password, salt, 64, { N: cost, r: 8, p: 1, maxmem: 256 * 1024 * 1024 });
  return timingSafeEqual(key, Buffer.from(digest, 'hex'));
}
function cookie(req) {
  return (req.headers.cookie || '').split(';').map(value => value.trim()).find(value => value.startsWith('__Host-odaja='))?.slice(13) || '';
}
function sessionCookie(value, seconds = SESSION_SECONDS) {
  return '__Host-odaja=' + value + '; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=' + seconds;
}
async function createSession(sql, res, memberId) {
  const token = randomBytes(32).toString('hex');
  await sql`INSERT INTO odaja_sessions (token_hash, member_id, expires_at)
    VALUES (${hash(token)}, ${memberId}, now() + interval '7 days')`;
  res.setHeader('Set-Cookie', sessionCookie(token));
}
async function rateLimit(sql, key, maximum) {
  const [row] = await sql`INSERT INTO odaja_rate_limits(key, window_start, attempts)
    VALUES (${key}, now(), 1)
    ON CONFLICT (key) DO UPDATE SET
      attempts = CASE WHEN odaja_rate_limits.window_start < now() - interval '15 minutes' THEN 1 ELSE odaja_rate_limits.attempts + 1 END,
      window_start = CASE WHEN odaja_rate_limits.window_start < now() - interval '15 minutes' THEN now() ELSE odaja_rate_limits.window_start END
    RETURNING attempts`;
  if (row.attempts > maximum) throw fail('rate_limit', 429);
}
async function authenticate(sql, req) {
  const token = cookie(req);
  if (!/^[a-f0-9]{64}$/.test(token)) return null;
  const [member] = await sql`SELECT m.id, m.nickname, m.city, m.kind, m.bio FROM odaja_members m
    JOIN odaja_sessions s ON s.member_id = m.id WHERE s.token_hash = ${hash(token)} AND s.expires_at > now()`;
  return member || null;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  try {
    if (!['GET', 'POST'].includes(req.method)) {
      res.setHeader('Allow', 'GET, POST');
      throw fail('method_not_allowed', 405);
    }
    if (req.method === 'POST') {
      const host = req.headers.host;
      if (req.headers.origin !== 'https://' + host || !String(req.headers['content-type'] || '').startsWith('application/json')) throw fail('forbidden', 403);
    }
    await initialize();
    const sql = database();
    if (req.method === 'GET') {
      const member = await authenticate(sql, req);
      if (!member) return res.status(200).json({ user: null });
      const photos = await sql`SELECT slot FROM odaja_photos WHERE member_id = ${member.id} ORDER BY slot`;
      return res.status(200).json({ user: publicProfile(member), photos: photos.map(photo => photo.slot) });
    }
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (!body || typeof body !== 'object') throw fail('invalid_request');
    const action = body.action;
    const ip = String(req.headers['x-vercel-forwarded-for'] || req.headers['x-forwarded-for'] || 'unknown').split(',')[0].trim();
    await rateLimit(sql, 'request:' + hash(ip), 180);
    if (['register','login'].includes(action)) {
      const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
      const password = body.password;
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || typeof password !== 'string' || password.length < 12 || password.length > 128) throw fail('invalid_credentials');
      await rateLimit(sql, 'auth-ip:' + hash(ip), 30);
      await rateLimit(sql, 'auth-email:' + hash(email), 12);
      if (action === 'register') {
        const nickname = typeof body.nickname === 'string' ? body.nickname.trim() : '';
        if (nickname.length < 2 || nickname.length > 40 || body.adult !== true) throw fail('invalid_profile');
        await rateLimit(sql, 'registration:' + hash(ip), 5);
        const id = randomUUID();
        const encoded = await passwordHash(password);
        const rows = await sql`INSERT INTO odaja_members(id, email, password_hash, nickname)
          VALUES (${id}, ${email}, ${encoded}, ${nickname})
          ON CONFLICT (email) DO NOTHING RETURNING id, nickname, city, kind, bio`;
        if (!rows.length) throw fail('registration_failed', 409);
        await createSession(sql, res, id);
        return res.status(201).json({ user: publicProfile(rows[0]), photos: [] });
      }
      const [member] = await sql`SELECT * FROM odaja_members WHERE email = ${email}`;
      const dummy = 'scrypt:131072:8:1:00000000000000000000000000000000:' + '00'.repeat(64);
      const valid = await verifyPassword(password, member?.password_hash || dummy);
      if (!member || !valid) throw fail('invalid_credentials', 401);
      await createSession(sql, res, member.id);
      return res.status(200).json({ user: publicProfile(member) });
    }
    const member = await authenticate(sql, req);
    if (!member) throw fail('unauthorized', 401);
    if (action === 'logout') {
      await sql`DELETE FROM odaja_sessions WHERE token_hash = ${hash(cookie(req))}`;
      res.setHeader('Set-Cookie', sessionCookie('', 0));
      return res.status(200).json({ ok: true });
    }
    if (action === 'profile') {
      const { nickname, city, kind, bio } = body;
      if (typeof nickname !== 'string' || nickname.trim().length < 2 || nickname.trim().length > 40 ||
          !['Beograd','Novi Sad'].includes(city) || !['solo','couple'].includes(kind) || typeof bio !== 'string' || bio.length > 1000) throw fail('invalid_profile');
      await sql`UPDATE odaja_members SET nickname = ${nickname.trim()}, city = ${city}, kind = ${kind}, bio = ${bio} WHERE id = ${member.id}`;
      return res.status(200).json({ ok: true });
    }
    if (['upload','remove'].includes(action)) {
      if (!Number.isInteger(body.slot) || body.slot < 1 || body.slot > 3) throw fail('invalid_slot');
      if (action === 'remove') {
        await sql`DELETE FROM odaja_photos WHERE member_id = ${member.id} AND slot = ${body.slot}`;
        return res.status(200).json({ ok: true });
      }
      if (typeof body.data !== 'string' || body.data.length > Math.ceil(MAX_PHOTO_BYTES / 3) * 4 || !/^[A-Za-z0-9+/]+={0,2}$/.test(body.data)) throw fail('invalid_photo');
      const input = Buffer.from(body.data, 'base64');
      if (input.length > MAX_PHOTO_BYTES) throw fail('invalid_photo');
      let output;
      try {
        const processor = sharp(input, { limitInputPixels: 25000000, animated: false });
        const metadata = await processor.metadata();
        if (!['jpeg','png','webp'].includes(metadata.format)) throw fail('invalid_photo');
        output = await processor.rotate().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
      } catch { throw fail('invalid_photo'); }
      if (output.length > MAX_PHOTO_BYTES) throw fail('invalid_photo');
      await sql`INSERT INTO odaja_photos(member_id, slot, image) VALUES (${member.id}, ${body.slot}, decode(${output.toString('base64')}, 'base64'))
        ON CONFLICT (member_id, slot) DO UPDATE SET image = EXCLUDED.image`;
      return res.status(200).json({ ok: true });
    }
    if (action === 'delete-account') {
      const [record] = await sql`SELECT password_hash FROM odaja_members WHERE id = ${member.id}`;
      if (typeof body.password !== 'string' || body.password.length > 128 || !await verifyPassword(body.password, record.password_hash)) throw fail('invalid_credentials', 401);
      await sql`DELETE FROM odaja_members WHERE id = ${member.id}`;
      res.setHeader('Set-Cookie', sessionCookie('', 0));
      return res.status(200).json({ ok: true });
    }
    throw fail('invalid_request');
  } catch (error) {
    const code = error.status ? error.message : 'service_unavailable';
    return res.status(error.status || 503).json({ error: code });
  }
}

export { authenticate, passwordHash, verifyPassword };
