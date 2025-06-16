// lib/db.js
import mysql from 'mysql2/promise';


export const pool = mysql.createPool({
  host: '127.0.0.1',  // ? use IPv4 address
  user: 'root',
  password: 'tsitsitsitsi',
  database: 'dashboard',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});
