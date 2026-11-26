import { neon } from '@neondatabase/serverless';

let ready;
export function database() {
  if (!process.env.DATABASE_URL) throw new Error('Database unavailable');
  return neon(process.env.DATABASE_URL);
}

export async function initialize() {
  if (!ready) {
    const sql = database();
    ready = sql.transaction([
      sql`SELECT pg_advisory_xact_lock(83241701)`,
      sql`CREATE TABLE IF NOT EXISTS odaja_members (
        id uuid PRIMARY KEY,
        email text NOT NULL UNIQUE,
        password_hash text NOT NULL,
        nickname text NOT NULL CHECK (char_length(nickname) BETWEEN 2 AND 40),
        city text NOT NULL DEFAULT 'Beograd' CHECK (city IN ('Beograd', 'Novi Sad')),
        kind text NOT NULL DEFAULT 'solo' CHECK (kind IN ('solo', 'couple')),
        bio text NOT NULL DEFAULT '' CHECK (char_length(bio) <= 1000),
        created_at timestamptz NOT NULL DEFAULT now()
      )`,
      sql`CREATE TABLE IF NOT EXISTS odaja_sessions (
        token_hash text PRIMARY KEY,
        member_id uuid NOT NULL REFERENCES odaja_members(id) ON DELETE CASCADE,
        expires_at timestamptz NOT NULL
      )`,
      sql`CREATE TABLE IF NOT EXISTS odaja_photos (
        member_id uuid NOT NULL REFERENCES odaja_members(id) ON DELETE CASCADE,
        slot smallint NOT NULL CHECK (slot BETWEEN 1 AND 3),
        image bytea NOT NULL CHECK (octet_length(image) <= 2097152),
        PRIMARY KEY (member_id, slot)
      )`,
      sql`ALTER TABLE odaja_members ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false`,
      sql`UPDATE odaja_members SET is_admin = true
        WHERE email = ${process.env.ODAJA_ADMIN_EMAIL || ''}
        AND created_at < ${process.env.ODAJA_ADMIN_BEFORE || '1970-01-01T00:00:00Z'}::timestamptz
        RETURNING id`,
      sql`CREATE TABLE IF NOT EXISTS odaja_media (
        kind text NOT NULL CHECK (kind IN ('listing', 'demo')),
        target_id text NOT NULL,
        slot smallint NOT NULL CHECK (slot BETWEEN 1 AND 3),
        image bytea NOT NULL CHECK (octet_length(image) <= 2097152),
        version uuid NOT NULL,
        PRIMARY KEY (kind, target_id, slot)
      )`,
      sql`CREATE TABLE IF NOT EXISTS odaja_rate_limits (
        key text PRIMARY KEY,
        window_start timestamptz NOT NULL,
        attempts integer NOT NULL
      )`
    ]).then(results => { console.info('ODAJA owner admin matches:', results[5].length); }).catch(error => { ready = undefined; throw error; });
  }
  await ready;
}
