// pages/api/current-devices.js
import { pool } from '@/lib/db';

export default async function handler(req, res) {
  const windowSec = 20;
  const [rows] = await pool.query(
    `SELECT pseudonym, device_name AS name, MIN(last_seen) AS first_ts, MAX(last_seen) AS last_ts
     FROM device_sessions
     WHERE last_seen >= DATE_SUB(NOW(), INTERVAL ? SECOND)
     GROUP BY pseudonym, device_name`,
    [windowSec]
  );

  const devices = rows.map(r => ({
    pseudonym: r.pseudonym,
    name: r.name,
    duration: Math.floor((r.last_ts - r.first_ts) / 1000)
  }));

  const totalUnique = devices.length;
  const maxDuration = devices.reduce((max, d) => Math.max(max, d.duration), 0);

  res.status(200).json({ devices, totalUnique, maxDuration });
}