// pages/api/rssi-current-groups.js
import { pool } from '@/lib/db';

export default async function handler(req, res) {
  const since = `NOW() - INTERVAL 20 SECOND`;

  const [rows] = await pool.query(
    `SELECT
       pseudonym,
       device_name,
       signal_strength AS rssi
     FROM device_sessions
     WHERE last_seen >= ${since}`
  );

  const groups = { near: [], mid: [], far: [] };
  rows.forEach(r => {
    const name = r.device_name;
    if (r.rssi > -50)       groups.near.push(name);
    else if (r.rssi > -70)  groups.mid.push(name);
    else                     groups.far.push(name);
  });

  res.status(200).json(groups);
}
