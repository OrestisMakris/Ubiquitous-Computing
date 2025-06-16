// pages/api/device-events.js
import { pool } from '@/lib/db';

export default async function handler(req, res) {
  const windowMin = 15;

  const [rows] = await pool.query(
    
    `SELECT UNIX_TIMESTAMP(last_seen)*1000 AS timestamp
     FROM device_sessions
     WHERE last_seen >= DATE_SUB(NOW(), INTERVAL ? MINUTE)
     ORDER BY last_seen ASC`,
    [windowMin]
  );
  res.status(200).json({ events: rows });
}