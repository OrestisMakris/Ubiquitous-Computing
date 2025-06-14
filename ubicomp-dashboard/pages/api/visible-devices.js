import { pool } from '@/lib/db';

export default async function handler(req, res) {
  const RECENT_SEC = 20;        // currently visible window
  const NEW_SEC    = 15 * 60;   // “new” threshold

  const [rows] = await pool.query(`
    WITH
      recent AS (
        SELECT
          pseudonym,
          device_name   AS name,
          MAX(signal_strength) AS rssi,
          MAX(UNIX_TIMESTAMP(last_seen)) AS last_ts
        FROM device_sessions
        WHERE last_seen >= DATE_SUB(NOW(), INTERVAL ? SECOND)
        GROUP BY pseudonym, device_name
      ),
      first_seen AS (
        SELECT
          pseudonym,
          MIN(UNIX_TIMESTAMP(last_seen)) AS first_ts
        FROM device_sessions
        WHERE last_seen >= DATE_SUB(NOW(), INTERVAL ? SECOND)
        GROUP BY pseudonym
      )
    SELECT
      r.pseudonym,
      r.name,
      r.rssi,
      r.last_ts,
      f.first_ts
    FROM recent r
    JOIN first_seen f USING (pseudonym)
    ORDER BY r.name ASC
  `, [RECENT_SEC, NEW_SEC]);

  const now = Math.floor(Date.now() / 1000);
  const devices = rows.map(r => {
    const sessionLen = r.last_ts - r.first_ts;       // secs in this session
    const age        = now       - r.last_ts;         // secs since last seen
    const isNew      = r.first_ts >= now - NEW_SEC;   // first seen <15min ago?
    const group      = r.rssi > -50
                       ? 'near'
                       : r.rssi > -70
                         ? 'mid'
                         : 'far';

    return {
      pseudonym: r.pseudonym,
      name:      r.name,
      rssi:      r.rssi,
      duration:  sessionLen,
      isNew,
      group,
    };
  });

  res.status(200).json({ devices });
}