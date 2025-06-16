import { pool } from '@/lib/db';

export default async function handler(req, res) {
  // Get active real devices to know their current real names.
  const [realDeviceNameRows] = await pool.query(
    `SELECT DISTINCT pseudonym, device_name
     FROM device_sessions
     WHERE last_seen >= NOW() - INTERVAL 2 MINUTE AND device_name NOT LIKE '%(Unknown)%'`
  );
  const realNameMap = new Map(realDeviceNameRows.map(r => [r.pseudonym, r.device_name]));

  
  const [synthRows] = await pool.query(
    `SELECT pseudonym, device_name AS synthetic_name, message
     FROM synthetic_patterns
     WHERE pattern_type='cooccur'
       AND device_name NOT LIKE '%(Unknown)%'`
  );

  const cooccurPatterns = synthRows.map(s => ({
    pseudonym: s.pseudonym,
    //
    device_name: realNameMap.get(s.pseudonym) || s.synthetic_name,
    message: s.message
  }));

  res.status(200).json(cooccurPatterns);
}