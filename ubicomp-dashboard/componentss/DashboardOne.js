import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  PieChart, Pie, Cell, ResponsiveContainer as PieResp, Tooltip as PieTip,
  BarChart, Bar, XAxis, YAxis, Tooltip as BarTip, ResponsiveContainer as BarResp
} from 'recharts';

const COLORS = ['#151dbd','#4f5fe8','#8fa9ff','#dce1ff'];

export default function DashboardOne() {
  const [liveCount, setLive] = useState(0);
  const [dailyCount, setDaily] = useState(0);
  const [nameAnalysis, setName] = useState({ commonInitial: '', topKeys: [] });
  const [rssi, setRssi] = useState([]);
  const [clsDist, setCls] = useState([]);

  useEffect(() => {
    const fetchAll = async () => {
      const [live, daily, name, rs, cls] = await Promise.all([
        fetch('/api/live-count').then(r => r.json()),
        fetch('/api/daily-unique').then(r => r.json()),
        fetch('/api/name-analysis').then(r => r.json()),
        fetch('/api/rssi-histogram').then(r => r.json()),
        fetch('/api/class-distribution').then(r => r.json()),
      ]);
      setLive(live.liveCount);
      setDaily(daily.dailyCount);
      setName(name);
      setRssi(rs);
      setCls(cls);
    };
    fetchAll();
    const iv = setInterval(fetchAll, 10000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="space-y-10">
      <header className="text-center py-4">
        <h1 className="text-3xl font-semibold">📡 UbiComp Live Presence Dashboard</h1>
        <p className="text-sm text-gray-500">CEID_NE576 — Καθ. Πολυζωγοπούλου — Ομάδα: Ορέστης Μακρής</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>👥 Πλήθος Παρόντων Τώρα</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl">{liveCount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>📆 Μοναδικοί Επισκέπτες Σήμερα</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl">{dailyCount}</p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-2xl">🔤 Ανάλυση Ονομάτων</CardTitle>
          </CardHeader>
          <CardContent>
            <p>📛 Πιο συχνό αρχικό όνομα: <strong>{nameAnalysis.commonInitial}</strong></p>
            <p>⌨️ Δημοφιλή πλήκτρα-χαρακτήρες: <strong>{nameAnalysis.topKeys.join(', ')}</strong></p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>📶 Κατανομή RSSI</CardTitle>
          </CardHeader>
          <CardContent>
            <BarResp width="100%" height={200}>
              <BarChart data={rssi}>
                <XAxis dataKey="range" />
                <YAxis />
                <BarTip />
                <Bar dataKey="count" fill="#151dbd" radius={[8, 8, 0, 0]} />
              </BarChart>
            </BarResp>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>🏷️ Κατανομή Κατηγοριών</CardTitle>
          </CardHeader>
          <CardContent>
            <PieResp width="100%" height={200}>
              <PieChart>
                <Pie
                  data={clsDist}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  paddingAngle={5}
                >
                  {clsDist.map((e, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <PieTip />
              </PieChart>
            </PieResp>
          </CardContent>
        </Card>
      </div>

      <footer className="text-center text-sm text-gray-400">
        © 2025 | CEID_NE576 — Ορέστης Μακρής
      </footer>
    </div>
  );
}
