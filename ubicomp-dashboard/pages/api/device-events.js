// pages/api/device-events.js
import { pool } from '@/lib/db';

export default async function handler(req, res) {
  const windowMin = 15;
  const since = `NOW() - INTERVAL ${windowMin} MINUTE`;

  const [rows] = await pool.query(
    `SELECT
       pseudonym,
       UNIX_TIMESTAMP(last_seen)*1000 AS timestamp
     FROM device_sessions
     WHERE last_seen >= ${since}
     ORDER BY last_seen ASC;`
  );

  res.status(200).json(rows);
}
