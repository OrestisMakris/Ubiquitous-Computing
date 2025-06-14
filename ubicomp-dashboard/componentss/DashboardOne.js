import React, { useEffect, useState } from 'react';
import { Dialog, DialogTrigger, DialogContent } from '@radix-ui/react-dialog';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  PieChart, Pie, Cell, ResponsiveContainer as PieResp, Tooltip as PieTip,
  BarChart, Bar, XAxis, YAxis, Tooltip as BarTip, ResponsiveContainer as BarResp
} from 'recharts';

const COLORS = ['#151dbd', '#4f5fe8', '#8fa9ff', '#dce1ff'];
const BAR_COLOR = '#03109e';

export default function DashboardOne() {
  const [liveCount, setLive] = useState(0);
  const [dailyCount, setDaily] = useState(0);
  const [commonClass, setCommonClass] = useState('');
  const [rssi, setRssi] = useState([]);
  const [clsDist, setCls] = useState([]);

  useEffect(() => {
    async function fetchAll() {
      const [liveRes, dailyRes, classRes, rsRes, clsRes] = await Promise.all([
        fetch('/api/live-count').then(r => r.json()),
        fetch('/api/daily-unique').then(r => r.json()),
        fetch('/api/name-analysis').then(r => r.json()),
        fetch('/api/rssi-histogram').then(r => r.json()),
        fetch('/api/class-distribution').then(r => r.json()),
      ]);
      setLive(liveRes.liveCount);
      setDaily(dailyRes.dailyCount);
      setCommonClass(classRes.commonClass);
      setRssi(rsRes);
      setCls(clsRes);
    }
    fetchAll();
    const iv = setInterval(fetchAll, 10000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="min-h-screen p-8 bg-gradient-to-b from-gray-50 to-gray-100 font-sans">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-5xl font-extrabold text-gray-900 leading-tight">📡 Live Presence Dashboard</h1>
          <p className="mt-2 text-lg text-gray-600">CEID NE576 — O. Makris</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <button className="px-5 py-3 bg-white/80 backdrop-blur-md rounded-full shadow-md hover:shadow-lg transition-all">
              About
            </button>
          </DialogTrigger>
          <DialogContent className="bg-white/80 backdrop-blur-md rounded-3xl p-8 w-full max-w-lg shadow-lg">
            <h2 className="text-3xl font-semibold mb-4">About This Dashboard</h2>
            <p className="text-gray-700 text-base">Apple-inspired glassy UI with Tailwind, SF Pro typography, and subtle animations.</p>
          </DialogContent>
        </Dialog>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="animate-pulse p-6">
          <CardHeader>
            <CardTitle className="text-xl">📶 Now Present</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-6xl font-light text-gray-900">{liveCount}</p>
          </CardContent>
        </Card>

        <Card className="animate-pulse p-6">
          <CardHeader>
            <CardTitle className="text-xl">🔤 Unique Today</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-6xl font-light text-gray-900">{dailyCount}</p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 p-6">
          <CardHeader>
            <CardTitle className="text-xl">Device Category Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg text-gray-800">Most Common: <strong>{commonClass}</strong></p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 p-6">
          <CardHeader>
            <CardTitle className="text-xl">📶 RSSI Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <BarResp width="100%" height={240}>
              <BarChart data={rssi} className="rounded-xl overflow-hidden">
                <XAxis dataKey="range" tick={{ fontFamily: 'SF Pro Display', fontSize: 14 }} />
                <YAxis tick={{ fontFamily: 'SF Pro Display', fontSize: 14 }} />
                <BarTip />
                <Bar dataKey="count" fill={BAR_COLOR} radius={[8, 8, 0, 0]} />
              </BarChart>
            </BarResp>
          </CardContent>
        </Card>

        <Card className="p-6">
          <CardHeader>
            <CardTitle className="text-xl">Category Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <PieResp width="100%" height={240}>
              <PieChart>
                <Pie data={clsDist} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" paddingAngle={5}>
                  {clsDist.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <PieTip />
              </PieChart>
            </PieResp>
          </CardContent>
        </Card>
      </div>

      <footer className="text-center text-gray-500 mt-12 text-base">
        © 2025 | CEID NE576 — Orestis Makris
      </footer>
    </div>
  );
}