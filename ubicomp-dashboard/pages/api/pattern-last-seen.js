import { pool } from '@/lib/db';

export default async function handler(req, res) {
  const [synth] = await pool.query(
    `SELECT pseudonym, device_name, message
     FROM synthetic_patterns
     WHERE pattern_type='last_seen'`
  );
  const [real] = await pool.query(
    `SELECT DISTINCT pseudonym, device_name
     FROM device_sessions
     WHERE last_seen >= NOW() - INTERVAL 2 MINUTE`
  );
  const realMap = Object.fromEntries(real.map(r => [r.pseudonym, r.device_name]));

  // drop the [Real] prefix – if real, we simply use the up‐to‐date name
  const merged = synth.map(r => ({
    device_name: realMap[r.pseudonym] || r.device_name,
    message: r.message
  }));

  res.status(200).json(merged);
}