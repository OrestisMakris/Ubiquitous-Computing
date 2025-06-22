import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  PieChart, Pie, Cell, ResponsiveContainer as PieResp, Tooltip as PieTip,
  BarChart, Bar, XAxis, YAxis, Tooltip as BarTip, ResponsiveContainer as BarResp
} from 'recharts';

const COLORS = ['#151dbd', '#4f5fe8', '#8fa9ff', '#dce1ff'];

export default function DashboardOne() {
  const [liveCount, setLive] = useState(0);
  const [dailyCount, setDaily] = useState(0);
  const [nameAnalysis, setName] = useState({ commonClass: '' });
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

// ...existing code...
  return (
    <div className="space-y-10">
      <header className="text-center py-6">
        <p className="text-5xl text-[#0017a5] font-extrabold">
          📡 UbiComp Live Presence Dashboard
        </p>
        <p className="mt-16 text-lg text-gray-600">
          CEID_NE576 — Ubiquitous Computing Live Exercise 2024/25<br/>
          Prof. Andreas Komninos — Authors: Orestis Antonis Makris
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">🔹Πλήθος Παρόντων Τώρα</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-6xl font-bold text-[#0017a5]">{liveCount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold"> 🔹Μοναδικοί Επισκέπτες Σήμερα</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-6xl font-bold text-[#0017a5]">{dailyCount}</p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-3xl font-bold">🔹Ανάλυση Ονομάτων Συσκευών</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl">
              Πιο συχνός τύπος συσκευής: <strong className="font-extrabold">{nameAnalysis.commonClass}</strong>
            </p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">📊 Κατανομή RSSI</CardTitle>
          </CardHeader>
          <CardContent>
            <BarResp width="100%" height={250}>
              <BarChart data={rssi} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <XAxis dataKey="range" tick={{ fontSize: 16, fontWeight: 'bold' }} />
                <YAxis domain={[0, 'dataMax']} tick={{ fontSize: 16, fontWeight: 'bold' }} />
                <BarTip contentStyle={{ fontSize: '16px' }} />
                <Bar dataKey="count" radius={[8, 8, 0, 0]} fill="#0017a5" />
              </BarChart>
            </BarResp>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Κατανομή Κατηγοριών Συσκευών</CardTitle>
          </CardHeader>
          <CardContent>
            <PieResp width="100%" height={250}>
              <PieChart>
                <Pie
                  data={clsDist}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  dataKey="value"
                  paddingAngle={5}
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {clsDist.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
            </Pie>
                <PieTip contentStyle={{ fontSize: '16px' }} />
              </PieChart>
            </PieResp>
          </CardContent>
        </Card>
      </div>
    <Card className="mx-auto max-w-2xl">
  <CardContent className="pt-6">
    <p className="text-center text-3xl md:text-4xl font-extrabold text-gray-800">
      🔒 Ειδοποίηση Απορρήτου: Όλα τα δεδομένα είναι ανωνυμοποιημένα και συγκεντρωτικά. Δεν πραγματοποιείται ατομική παρακολούθηση.
    </p>
  </CardContent>
</Card>
      <footer className="text-center text-base text-gray-500 font-bold">
        © 2025 | CEID_NE576 — Ubiquitous Computing Live Exercise<br/>
        👤 Ορέστης Αντώνης Μακρής (AM 1084516)
      </footer>
    </div>
  );
}