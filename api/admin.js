import { randomUUID } from 'node:crypto';
import { database, initialize } from '../lib/database.js';
import { optimizePhoto } from '../lib/photos.js';
import { validMediaTarget } from '../lib/media-targets.js';
import { authenticate } from './member.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  try {
    if (!['GET', 'POST'].includes(req.method)) return res.status(405).end();
    if (req.method === 'POST' && (req.headers.origin !== 'https://' + req.headers.host ||
        !String(req.headers['content-type'] || '').startsWith('application/json'))) return res.status(403).json({ error: 'forbidden' });
    await initialize();
    const sql = database();
    const user = await authenticate(sql, req);
    if (!user?.is_admin) return res.status(403).json({ error: 'forbidden' });
    if (req.method === 'GET') {
      const search = typeof req.query.search === 'string' ? req.query.search.slice(0, 100) : '';
      const pattern = '%' + search.replaceAll('%', '\\%').replaceAll('_', '\\_') + '%';
      const members = await sql`SELECT id, nickname, email FROM odaja_members
        WHERE nickname ILIKE ${pattern} OR email ILIKE ${pattern}
        ORDER BY created_at DESC LIMIT 50`;
      return res.status(200).json({ members });
    }
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (!body || !['upload', 'remove'].includes(body.action) || !Number.isInteger(body.slot) || body.slot < 1 || body.slot > 3) {
      return res.status(400).json({ error: 'invalid_request' });
    }
    const { kind, targetId, slot, action } = body;
    if (kind === 'member') {
      if (typeof targetId !== 'string' || !/^[a-f0-9-]{36}$/.test(targetId)) return res.status(400).json({ error: 'invalid_request' });
      const [target] = await sql`SELECT id FROM odaja_members WHERE id = ${targetId}`;
      if (!target) return res.status(404).json({ error: 'not_found' });
      if (action === 'remove') {
        await sql`DELETE FROM odaja_photos WHERE member_id = ${targetId} AND slot = ${slot}`;
      } else {
        const output = await optimizePhoto(body.data);
        await sql`INSERT INTO odaja_photos(member_id, slot, image) VALUES (${targetId}, ${slot}, decode(${output.toString('base64')}, 'base64'))
          ON CONFLICT (member_id, slot) DO UPDATE SET image = EXCLUDED.image`;
      }
    } else {
      if (!validMediaTarget(kind, targetId)) return res.status(400).json({ error: 'invalid_request' });
      if (action === 'remove') {
        await sql`DELETE FROM odaja_media WHERE kind = ${kind} AND target_id = ${targetId} AND slot = ${slot}`;
      } else {
        const output = await optimizePhoto(body.data);
        await sql`INSERT INTO odaja_media(kind, target_id, slot, image, version)
          VALUES (${kind}, ${targetId}, ${slot}, decode(${output.toString('base64')}, 'base64'), ${randomUUID()})
          ON CONFLICT (kind, target_id, slot) DO UPDATE SET image = EXCLUDED.image, version = EXCLUDED.version`;
      }
    }
    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(error.status || 503).json({ error: error.status ? error.message : 'service_unavailable' });
  }
}
