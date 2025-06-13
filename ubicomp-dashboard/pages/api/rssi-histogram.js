// pages/api/rssi-histogram.js
import { pool } from '@/lib/db';

export default async function handler(req, res) {
  const [rows] = await pool.query(
    `SELECT
      SUM(signal_strength > -50) AS near,
      SUM(signal_strength BETWEEN -70 AND -50) AS mid,
      SUM(signal_strength < -70) AS far
     FROM device_sessions`
  );
  const { near, mid, far } = rows[0];
  res.status(200).json([
    { range: '???t?', count: near },
    { range: '???s???', count: mid },
    { range: '?a????', count: far },
  ]);
}
