// pages/api/pattern-routine.js
import { pool } from '@/lib/db';

export default async function handler(req, res) {
  const [rows] = await pool.query(
    `SELECT device_name, message
     FROM dashboard_patterns.device_patterns
     WHERE pattern_type='routine'
     ORDER BY created_at DESC
     LIMIT 5`
  );
  res.status(200).json(rows);
}