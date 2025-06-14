// pages/api/rssi-histogram.js
import { pool } from '@/lib/db';

export default async function handler(req, res) {
  const twentyMinutesAgo = Math.floor(Date.now() / 1000) - (15* 60); // 20 minutes ago

  const [rows] = await pool.query(
    `SELECT
      SUM(signal_strength > -50) AS near,
      SUM(signal_strength BETWEEN -70 AND -50) AS mid,
      SUM(signal_strength < -70) AS far
     FROM device_sessions
     WHERE UNIX_TIMESTAMP(last_seen) >= ?`,
    [twentyMinutesAgo]
  );

  const { near, mid, far } = rows[0];

  res.status(200).json([
    { range: 'near (> -50 dB)', count: near },
    { range: 'mid (-70 to -50 dB)', count: mid },
    { range: 'far (< -70 dB)', count: far },
  ]);
}
