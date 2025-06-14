
// pages/api/current-devices.js
import { pool } from '@/lib/db';
export default async function handler(req, res) {
  const windowSec = 20;
  const [rows] = await pool.query(
    `SELECT pseudonym, device_name AS name, 
     MIN(last_seen) AS first_ts, MAX(last_seen) AS last_ts
     FROM device_sessions
     WHERE last_seen >= DATE_SUB(NOW(), INTERVAL ? SECOND)
     GROUP BY pseudonym, device_name`,
    [windowSec]
  );
  const totalUnique = rows.length;
  const devices = rows.map(r => ({
    pseudonym: r.pseudonym,
    name: r.name,
    duration: TIMESTAMPDIFF(SECOND, r.first_ts, r.last_ts)
  }));
  const maxDuration = rows.reduce((acc, r) => Math.max(acc, (new Date(r.last_ts) - new Date(r.first_ts)) / 1000), 0);
  res.status(200).json({ devices, totalUnique, maxDuration });
}