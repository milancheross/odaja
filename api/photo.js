import { database, initialize } from '../lib/database.js';
import { authenticate } from './member.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'GET') return res.status(405).end();
  const slot = Number(req.query.slot);
  if (!Number.isInteger(slot) || slot < 1 || slot > 3) return res.status(400).end();
  try {
    await initialize();
    const sql = database();
    const user = await authenticate(sql, req);
    if (!user) return res.status(401).end();
    const target = req.query.memberId || user.id;
    if (target !== user.id && !user.is_admin) return res.status(403).end();
    if (!/^[a-f0-9-]{36}$/.test(target)) return res.status(400).end();
    const [photo] = await sql`SELECT encode(image, 'base64') AS data FROM odaja_photos WHERE member_id = ${target} AND slot = ${slot}`;
    if (!photo) return res.status(404).end();
    res.setHeader('Content-Type', 'image/webp');
    return res.status(200).send(Buffer.from(photo.data, 'base64'));
  } catch {
    return res.status(503).end();
  }
}
