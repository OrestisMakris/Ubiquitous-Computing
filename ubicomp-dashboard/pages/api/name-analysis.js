
import { pool } from '@/lib/db';

export default async function handler(req, res) {
  
  const [rows] = await pool.query(
    `SELECT major_class FROM device_sessions
     WHERE UNIX_TIMESTAMP(last_seen) > UNIX_TIMESTAMP(NOW()) - 600`
  );

  
  const counts = rows.reduce((acc, { major_class }) => {
    acc[major_class] = (acc[major_class] || 0) + 1;
    return acc;
  }, {});


  
  const commonClass = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || '';

  res.status(200).json({ commonClass });
}
