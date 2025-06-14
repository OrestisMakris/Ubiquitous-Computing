import { pool } from '@/lib/db';

export default async function handler(req, res) {
  // (1) load synthetic
  const [synth] = await pool.query(
    `SELECT pseudonym, device_name, message
     FROM synthetic_patterns
     WHERE pattern_type='last_seen'`
  );

  // (2) load real names seen in last 15 min
  const [real] = await pool.query(
    `SELECT DISTINCT pseudonym, device_name
     FROM device_sessions
     WHERE last_seen >= NOW() - INTERVAL 15 MINUTE`
  );
  const realMap = Object.fromEntries(real.map(r => [r.pseudonym, r.device_name]));

  // (3) merge, overriding device_name when real
  const merged = synth.map(r => ({
    device_name: realMap[r.pseudonym]
                   ? `[Real] ${realMap[r.pseudonym]}`
                   : r.device_name,
    message: r.message
  }));

  res.status(200).json(merged);
}
