// pages/api/live-count.js
import { pool } from '@/lib/db';

export default async function handler(req, res) {
    const since = Math.floor(Date.now() / 1000) - 20; // 10 seconds
    const [rows] = await pool.query(
      `SELECT COUNT(DISTINCT pseudonym) AS count
       FROM device_sessions
       WHERE UNIX_TIMESTAMP(last_seen) > ?`,
      [since]
    );
    res.status(200).json({ liveCount: rows[0].count });
}
