// pages/api/class-distribution.js
import { pool } from '@/lib/db';

export default async function handler(req, res) {
  const [rows] = await pool.query(
    `SELECT major_class, COUNT(*) AS cnt
     FROM device_sessions
     WHERE UNIX_TIMESTAMP(last_seen) > UNIX_TIMESTAMP(NOW()) - 600
     GROUP BY major_class`
  );

  // format for PieChart
  const data = rows.map(({ major_class, cnt }) => ({
    name: major_class,
    value: cnt
  }));

  res.status(200).json(data);
}
