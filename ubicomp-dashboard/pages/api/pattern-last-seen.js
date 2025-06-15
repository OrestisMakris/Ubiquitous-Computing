import { pool } from '@/lib/db';

export default async function handler(req, res) {
  // Get real, active devices (seen in last 2 mins, not 'Unknown')
  // These define the 'is_real_device' status and provide the definitive real name and last seen message.
  const [realDeviceActivityRows] = await pool.query(`
    SELECT pseudonym, device_name, MAX(last_seen) AS last_seen
      FROM device_sessions
     WHERE device_name NOT LIKE '%(Unknown)%'
     GROUP BY pseudonym, device_name
    HAVING MAX(last_seen) >= NOW() - INTERVAL 2 MINUTE
    ORDER BY last_seen DESC
  `);
  const realDeviceActivities = realDeviceActivityRows.map(r => ({
    pseudonym:   r.pseudonym,
    device_name: r.device_name, // This is the real name
    message:     `Last Seen: ${new Date(r.last_seen).toLocaleString()}`,
    is_real_activity_marker: true // Crucial flag for frontend
  }));

  // Get all synthetic 'last_seen' (movement) patterns, excluding 'Unknown'
  // These apply to both real (as additional context) and fake devices.
  const [syntheticMovementRows] = await pool.query(`
    SELECT pseudonym, device_name AS synthetic_name, message
      FROM synthetic_patterns
     WHERE pattern_type = 'last_seen'
       AND device_name NOT LIKE '%(Unknown)%'
  `);
  const syntheticMovements = syntheticMovementRows.map(s => ({
    pseudonym: s.pseudonym,
    synthetic_name: s.synthetic_name, // Original name from synthetic_patterns
    message: s.message,
    is_real_activity_marker: false
  }));

  // Send both. Frontend will use pseudonym to merge and prioritize.
  res.status(200).json([...realDeviceActivities, ...syntheticMovements]);
}