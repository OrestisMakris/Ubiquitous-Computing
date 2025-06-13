// pages/api/device-log.js
import { pool } from '@/lib/db';
import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { mac, name, rssi } = req.body;
  if (!mac || !name || typeof rssi !== 'number')
    return res.status(400).json({ error: 'Missing fields' });

  const pseudonym = crypto
    .createHash('sha256')
    .update(mac + process.env.SESSION_KEY)
    .digest('hex')
    .slice(0, 12);

  await pool.query(
    `REPLACE INTO device_sessions
      (pseudonym, device_name, signal_strength, last_seen)
     VALUES (?, ?, ?, NOW())`,
    [pseudonym, name, rssi]
  );
  res.status(200).json({ ok: true });
}
