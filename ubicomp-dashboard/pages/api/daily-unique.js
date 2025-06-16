
import { pool } from '@/lib/db';
export default async function handler(req, res) {
  const now = new Date();
  const nine = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9);
  const since = Math.floor(nine.getTime() / 1000);

  const [rows] = await pool.query(

    `SELECT COUNT(DISTINCT pseudonym) AS count
     FROM device_sessions
     WHERE UNIX_TIMESTAMP(last_seen) > ?`,
    [since]
  );

  res.status(200).json({ dailyCount: rows[0].count });
}
