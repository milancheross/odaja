import { database, initialize } from '../lib/database.js';
import { validMediaTarget } from '../lib/media-targets.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'GET') return res.status(405).end();
  try {
    await initialize();
    const sql = database();
    if (req.query.manifest === '1') {
      const rows = await sql`SELECT kind, target_id, slot, version FROM odaja_media ORDER BY kind, target_id, slot`;
      return res.status(200).json({ media: rows });
    }
    const { kind, id } = req.query;
    const slot = Number(req.query.slot);
    if (!validMediaTarget(kind, id) || !Number.isInteger(slot) || slot < 1 || slot > 3) return res.status(400).end();
    const [photo] = await sql`SELECT encode(image, 'base64') AS data FROM odaja_media
      WHERE kind = ${kind} AND target_id = ${id} AND slot = ${slot}`;
    if (!photo) return res.status(404).end();
    res.setHeader('Content-Type', 'image/webp');
    return res.status(200).send(Buffer.from(photo.data, 'base64'));
  } catch {
    return res.status(503).end();
  }
}
