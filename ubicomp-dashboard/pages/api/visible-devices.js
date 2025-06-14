import { pool } from '@/lib/db';

export default async function handler(req, res) {
  // only devices seen in last 20s
  const windowSec = 20;
  const [rows] = await pool.query(
    `SELECT 
       pseudonym,
       device_name AS name,
       MIN(UNIX_TIMESTAMP(last_seen)) AS first_ts,
       MAX(UNIX_TIMESTAMP(last_seen)) AS last_ts,
       MAX(signal_strength)        AS rssi
     FROM device_sessions
     WHERE last_seen >= DATE_SUB(NOW(), INTERVAL ? SECOND)
     GROUP BY pseudonym, device_name
     ORDER BY name ASC`,
    [windowSec]
  );

  const devices = rows.map(r => {
    const duration = Math.floor(r.last_ts - r.first_ts);      // seconds
    const isNew    = duration < windowSec;                   // “New!” if <20s
    const group    = r.rssi > -50 ? 'near' 
                     : r.rssi > -70 ? 'mid' 
                     : 'far';
    return {
      pseudonym: r.pseudonym,
      name:      r.name,
      duration, 
      isNew,
      group,
      rssi:      r.rssi
    };
  });

  res.status(200).json({ devices });
}