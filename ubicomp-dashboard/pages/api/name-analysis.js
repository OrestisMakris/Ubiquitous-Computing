// pages/api/name-analysis.js
import { pool } from '@/lib/db';

export default async function handler(req, res) {
  // fetch all current names
  const [rows] = await pool.query(
    `SELECT device_name FROM device_sessions
     WHERE UNIX_TIMESTAMP(last_seen) > UNIX_TIMESTAMP(NOW()) - 600`
  );
  const initials = {};
  const keywords = {};
  rows.forEach(({ device_name }) => {
    const init = device_name[0].toUpperCase();
    initials[init] = (initials[init] || 0) + 1;
    device_name
      .match(/\b[A-Za-z]{2,}\b/g)
      ?.forEach((w) => {
        keywords[w] = (keywords[w] || 0) + 1;
      });
  });
  // pick top initial
  const commonInitial = Object.entries(initials).sort((a,b)=>b[1]-a[1])[0]?.[0]||'';
  // top 3 keywords
  const topKeys = Object.entries(keywords)
    .sort((a,b)=>b[1]-a[1])
    .slice(0,3)
    .map(([w])=>w);
  res.status(200).json({ commonInitial, topKeys });
}
