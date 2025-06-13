// pages/api/class-distribution.js
import { pool } from '@/lib/db';

export default async function handler(req, res) {
  const [all] = await pool.query(
    `SELECT device_name FROM device_sessions`
  );
  let counts = { Phones:0, Headphones:0, Peripherals:0, Other:0 };
  all.forEach(({ device_name }) => {
    const dn = device_name.toLowerCase();
    if (dn.includes('phone')) counts.Phones++;
    else if (dn.includes('bud')||dn.includes('ear')) counts.Headphones++;
    else if (['mouse','keyboard','pad'].some(k=>dn.includes(k))) counts.Peripherals++;
    else counts.Other++;
  });
  const total = Object.values(counts).reduce((a,b)=>a+b,0)||1;
  res.status(200).json(Object.entries(counts).map(([name,val])=>({
    name, value: Math.round(val/total*100)
  })));
}
