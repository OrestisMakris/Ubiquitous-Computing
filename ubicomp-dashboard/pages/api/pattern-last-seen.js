import { pool } from '@/lib/db';

export default async function handler(req, res) {
  // 1) synthetic last_seen
  const [synth] = await pool.query(`
    SELECT pseudonym, device_name, message
      FROM synthetic_patterns
     WHERE pattern_type='last_seen'
       AND device_name NOT LIKE '%(Unknown)%'
  `);
  // 2) real devices seen in last 2 min
  const [realRows] = await pool.query(`
    SELECT pseudonym, device_name, MAX(last_seen) AS last_seen
      FROM device_sessions
     GROUP BY pseudonym, device_name
    HAVING MAX(last_seen) >= NOW() - INTERVAL 2 MINUTE
    ORDER BY last_seen DESC
  `);
  const real = realRows.map(r => ({
    pseudonym:   r.pseudonym,
    device_name: r.device_name,
    message:     `Last Seen: ${new Date(r.last_seen).toLocaleString()}`
  }));

  // hide any unknown and merge
  const synthFiltered = synth.map(s => ({
    pseudonym:   s.pseudonym,
    device_name: s.device_name,
    message:     s.message
  }));

  res.status(200).json([...real, ...synthFiltered]);
}