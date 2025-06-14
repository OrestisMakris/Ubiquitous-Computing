// pages/api/rssi-current-groups.js
import { pool } from '@/lib/db';

export default async function handler(req, res) {
  const [rows] = await pool.query(
    `SELECT device_name AS name, signal_strength AS rssi
     FROM device_sessions
     WHERE last_seen >= DATE_SUB(NOW(), INTERVAL 20 SECOND)`
  );
  const groups = { near: [], mid: [], far: [] };
  rows.forEach(r => {
    if (r.rssi > -50) groups.near.push(r.name);
    else if (r.rssi > -70) groups.mid.push(r.name);
    else groups.far.push(r.name);
  });
  res.status(200).json(groups);
}