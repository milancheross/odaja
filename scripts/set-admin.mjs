import { neon } from '@neondatabase/serverless';
const email = process.argv[2]?.trim().toLowerCase();
if (!email || !process.env.DATABASE_URL) {
  throw new Error('Provide an existing member email as the first argument and DATABASE_URL in the environment.');
}
const sql = neon(process.env.DATABASE_URL);
const members = await sql`UPDATE odaja_members SET is_admin = true WHERE email = ${email} RETURNING id, nickname`;
if (members.length !== 1) throw new Error('No registered member matches this email.');
console.log('Administrator access enabled for the selected existing account.');
