import { pool } from '@/lib/db';

export default async function handler(req, res) {
  const RECENT_SEC = 20; // How recent for a device to be "currently visible"
  const NEW_SEC = 15 * 60; // Threshold for a device to be considered "New!" based on its absolute first appearance

  const [rows] = await pool.query(
    `
    WITH
      -- Devices currently visible (seen in the last RECENT_SEC seconds)
      current_visible_devices AS (
        SELECT
          pseudonym,
          device_name AS name,
          MAX(signal_strength) AS rssi,
          MAX(UNIX_TIMESTAMP(last_seen)) AS current_last_ts -- Last time seen in the current visibility window
        FROM device_sessions
        WHERE last_seen >= DATE_SUB(NOW(), INTERVAL ? SECOND) -- RECENT_SEC
        GROUP BY pseudonym, device_name
      ),
      -- For devices currently visible, find their first appearance in the last NEW_SEC window
      -- This helps determine the duration of their current "streak" of visibility
      session_start_time AS (
        SELECT
          cvd.pseudonym,
          MIN(UNIX_TIMESTAMP(ds.last_seen)) AS session_first_ts
        FROM device_sessions ds
        JOIN current_visible_devices cvd ON ds.pseudonym = cvd.pseudonym
        WHERE ds.last_seen >= DATE_SUB(NOW(), INTERVAL ? SECOND) -- NEW_SEC
        GROUP BY cvd.pseudonym
      ),
      -- For devices currently visible, find their absolute first appearance ever in the database
      overall_start_time AS (
        SELECT
          cvd.pseudonym,
          MIN(UNIX_TIMESTAMP(ds.last_seen)) AS overall_first_ts
        FROM device_sessions ds
        JOIN current_visible_devices cvd ON ds.pseudonym = cvd.pseudonym
        GROUP BY cvd.pseudonym
      )
    SELECT
      cvd.pseudonym,
      cvd.name,
      cvd.rssi,
      cvd.current_last_ts,
      COALESCE(sst.session_first_ts, cvd.current_last_ts) AS session_first_ts, -- Handle cases where device might be new in overall_start_time but not have extensive history in session_start_time
      ost.overall_first_ts
    FROM current_visible_devices cvd
    LEFT JOIN session_start_time sst ON cvd.pseudonym = sst.pseudonym
    LEFT JOIN overall_start_time ost ON cvd.pseudonym = ost.pseudonym
    ORDER BY cvd.name ASC
  `,
    [RECENT_SEC, NEW_SEC]
  );

  const now_ts = Math.floor(Date.now() / 1000);
  const devices = rows.map((r) => {
    // Duration of the current session/streak (capped at NEW_SEC)
    const sessionLen = r.current_last_ts - r.session_first_ts;

    // Is the device truly new? (Its very first recorded appearance was within NEW_SEC)
    const isNew = r.overall_first_ts ? r.overall_first_ts >= now_ts - NEW_SEC : false;

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
      isNew,
      group,
    };
  });

  res.status(200).json({ devices });
}