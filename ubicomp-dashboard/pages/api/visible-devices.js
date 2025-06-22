import { pool } from '@/lib/db';

export default async function handler(req, res) {

  const RECENT_SEC = 11; 
  const NEW_WINDOW_SEC = 15 * 60;   
  const MAX_DURATION_LOOKBACK_SEC = 2 * 60 * 60; 

  const [rows] = await pool.query(
    `
    WITH
      current_visible_devices AS (
        SELECT
          pseudonym,
          device_name AS name,
          MAX(signal_strength) AS rssi,
          MAX(UNIX_TIMESTAMP(last_seen)) AS current_last_ts
        FROM device_sessions
        WHERE last_seen >= DATE_SUB(NOW(), INTERVAL ? SECOND) -- RECENT_SEC
        GROUP BY pseudonym, device_name
      ),
      session_start_for_duration AS (
        SELECT
          cvd.pseudonym,
          MIN(UNIX_TIMESTAMP(ds.last_seen)) AS first_ts_for_duration_calc
        FROM device_sessions ds
        JOIN current_visible_devices cvd ON ds.pseudonym = cvd.pseudonym
        WHERE ds.last_seen >= DATE_SUB(NOW(), INTERVAL ? SECOND) -- MAX_DURATION_LOOKBACK_SEC
        GROUP BY cvd.pseudonym
      )
    SELECT
      cvd.pseudonym,
      cvd.name,
      cvd.rssi,
      cvd.current_last_ts,
      COALESCE(ssfd.first_ts_for_duration_calc, cvd.current_last_ts) AS first_ts_for_duration,
      (
        SELECT NOT EXISTS (
          SELECT 1
          FROM device_sessions ds_new_check
          WHERE ds_new_check.pseudonym = cvd.pseudonym
            AND ds_new_check.last_seen >= DATE_SUB(NOW(), INTERVAL (? + ?) SECOND) -- Start of 15-min window before RECENT_SEC
            AND ds_new_check.last_seen < DATE_SUB(NOW(), INTERVAL ? SECOND)     -- End of 15-min window before RECENT_SEC
        )
      ) AS is_genuinely_new
    FROM current_visible_devices cvd
    LEFT JOIN session_start_for_duration ssfd ON cvd.pseudonym = ssfd.pseudonym
    ORDER BY cvd.name ASC
  `,
    [
      RECENT_SEC,                 // For current_visible_devices
      MAX_DURATION_LOOKBACK_SEC,  // For session_start_for_duration
      RECENT_SEC,                 // For is_genuinely_new subquery (part of lower bound)
      NEW_WINDOW_SEC,             // For is_genuinely_new subquery (part of lower bound)
      RECENT_SEC                  // For is_genuinely_new subquery (upper bound)
    ]
  );

  const devices = rows.map((r) => {
    const sessionLen = r.current_last_ts - r.first_ts_for_duration;

    const group =
      r.rssi > -50
        ? 'near'
        : r.rssi > -70
        ? 'mid'
        : 'far';

    return {
      pseudonym: r.pseudonym,
      name: r.name,
      rssi: r.rssi,
      duration: Math.max(0, sessionLen), // Ensure duration is not negative
      isNew: !!r.is_genuinely_new, // Convert SQL boolean (0 or 1) to JS boolean
      group,
    };
  });

  res.status(200).json({ devices });
}