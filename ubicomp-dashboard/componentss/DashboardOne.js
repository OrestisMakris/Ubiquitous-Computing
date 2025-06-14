import React, { useEffect, useState } from 'react';
import { Dialog, DialogTrigger, DialogContent } from '@radix-ui/react-dialog';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer as PieResp, Tooltip as PieTip,
         BarChart, Bar, XAxis, YAxis, Tooltip as BarTip, ResponsiveContainer as BarResp } from 'recharts';

const COLORS = ['#151dbd', '#4f5fe8', '#8fa9ff', '#dce1ff'];

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
    <div className="min-h-screen p-6 bg-gradient-to-b from-gray-50 to-gray-100 font-sans">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900">📡 Live Presence Dashboard</h1>
          <p className="mt-1 text-gray-600">CEID NE576 — O. Makris</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <button className="px-4 py-2 bg-white/80 backdrop-blur-md rounded-full shadow hover:shadow-lg transition">
              About
            </button>
          </DialogTrigger>
          <DialogContent className="bg-white/80 backdrop-blur-md rounded-2xl p-6 w-full max-w-md shadow-lg">
            <h2 className="text-2xl font-semibold mb-2">About This Dashboard</h2>
            <p className="text-gray-700">Apple-inspired glassy UI with tailwind and subtle animations.</p>
          </DialogContent>
        </Dialog>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-white/80 backdrop-blur-md rounded-2xl animate-pulse">
          <CardHeader>
            <CardTitle className="text-lg">📶 Now Present</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-5xl font-light text-gray-900">{liveCount}</p>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-md rounded-2xl animate-pulse">
          <CardHeader>
            <CardTitle className="text-lg">🔤 Unique Today</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-5xl font-light text-gray-900">{dailyCount}</p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 bg-white/80 backdrop-blur-md rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg">Device Category Analysis</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-800">
            <p>Most Common: <strong>{commonClass}</strong></p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 bg-white/80 backdrop-blur-md rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg">📶 RSSI Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <BarResp width="100%" height={200}>
              <BarChart data={rssi} className="rounded-lg">
                <XAxis dataKey="range" tick={{ fontFamily: 'SF Pro Display' }} />
                <YAxis tick={{ fontFamily: 'SF Pro Display' }} />
                <BarTip />
                <Bar dataKey="count" radius={[8,8,0,0]} />
              </BarChart>
            </BarResp>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-md rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg">Category Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <PieResp width="100%" height={200}>
              <PieChart>
                <Pie data={clsDist} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={5}>
                  {clsDist.map((e,i)=><Cell key={i} fill={COLORS[i%COLORS.length]} />)}
                </Pie>
                <PieTip />
              </PieChart>
            </PieResp>
          </CardContent>
        </Card>
      </div>

      <footer className="text-center text-gray-500 mt-8">
        © 2025 | CEID NE576 — Orestis Makris
      </footer>
    </div>
  );
}
