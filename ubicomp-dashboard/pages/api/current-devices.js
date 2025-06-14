// pages/api/current-devices.js
import { pool } from '@/lib/db';

export default async function handler(req, res) {
  // Cut‑off for “currently visible”
  const seconds = 20;
  const since = `NOW() - INTERVAL ${seconds} SECOND`;

  // For each pseudonym, find first_seen (earliest last_seen) in this window,
  // and the most recent last_seen and signal_strength.
  const [rows] = await pool.query(
    `SELECT
       pseudonym,
       device_name,
       signal_strength AS rssi,
       major_class,
       MIN(last_seen) AS first_seen,
       MAX(last_seen) AS last_seen
     FROM device_sessions
     WHERE last_seen >= ${since}
     GROUP BY pseudonym, device_name, major_class
     ORDER BY signal_strength DESC;`
  );

  // compute duration in seconds
  const now = Date.now();
  const devices = rows.map(r => ({
    pseudonym: r.pseudonym,
    name: r.device_name,
    rssi: r.rssi,
    majorClass: r.major_class,
    duration: Math.floor((now - new Date(r.first_seen).getTime()) / 1000)
  }));

  res.status(200).json({ devices, seconds });
}
