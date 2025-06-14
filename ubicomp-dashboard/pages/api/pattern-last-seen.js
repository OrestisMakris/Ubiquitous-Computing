import { pool } from '@/lib/db';

function fmtTime(dtStr) {
  const d = new Date(dtStr);
  const hh = d.getHours(), mm = String(d.getMinutes()).padStart(2,'0');
  if (hh < 12) return `Last seen this morning at ${hh}:${mm}.`;
  if (hh < 18) return `Last seen this afternoon at ${hh}:${mm}.`;
  return `Last seen this evening at ${hh}:${mm}.`;
}

export default async function handler(req, res) {
  // 1) pull synthetic patterns
  const [synth] = await pool.query(
    `SELECT pseudonym, device_name, message
       FROM synthetic_patterns
      WHERE pattern_type='last_seen'`
  );
  // 2) pull real devices’ latest timestamp
  const [realRows] = await pool.query(
    `SELECT pseudonym, device_name, MAX(last_seen) AS last_seen
       FROM device_sessions
      GROUP BY pseudonym`
  );

  const realMap = Object.fromEntries(
    realRows.map(r => [r.pseudonym, { name: r.device_name, msg: fmtTime(r.last_seen) }])
  );

  // 3) build final list: one real msg each + remaining synthetic
  const realMsgs = Object.values(realMap).map(r => ({
    device_name: r.name,
    message: r.msg
  }));

  const synthFiltered = synth
    .filter(s => !(s.pseudonym in realMap))
    .map(s => ({ device_name: s.device_name, message: s.message }));