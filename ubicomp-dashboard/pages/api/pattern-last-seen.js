import { pool } from '@/lib/db';

export default async function handler(req, res) {
  // fetch only devices seen in the last 2 minutes
  const [rows] = await pool.query(`
    SELECT
      pseudonym,
      device_name,
      MAX(last_seen) AS last_seen
    FROM device_sessions
    GROUP BY pseudonym, device_name
    HAVING MAX(last_seen) >= NOW() - INTERVAL 2 MINUTE
    ORDER BY last_seen DESC
  `);

  // map to one “Last Seen” message each
  const real = rows.map(r => ({
    pseudonym:   r.pseudonym,
    device_name: r.device_name,
    message:     `📍 Last Seen: ${new Date(r.last_seen).toLocaleString()}`
  }));

  res.status(200).json(real);