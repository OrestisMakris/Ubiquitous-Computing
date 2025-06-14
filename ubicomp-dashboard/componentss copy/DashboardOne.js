import React, { useEffect, useState } from 'react';
// Updated import to use the local, refactored card components
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import {
  PieChart, Pie, Cell, ResponsiveContainer as PieResp, Tooltip as PieTip,
  BarChart, Bar, XAxis, YAxis, Tooltip as BarTip, ResponsiveContainer as BarResp
} from 'recharts';

const COLORS = ['#151dbd', '#4f5fe8', '#8fa9ff', '#dce1ff', '#3b82f6', '#60a5fa']; // Added more colors
const BAR_CHART_FILL_COLOR = '#2563eb'; // Consistent bar color

export default function DashboardOne() {
  const [liveCount, setLive] = useState(0);
  const [dailyCount, setDaily] = useState(0);
  // Corrected nameAnalysis state to match API response structure
  const [nameAnalysis, setName] = useState({ commonInitial: '', topKeys: [] });
  const [rssi, setRssi] = useState([]);
  const [clsDist, setCls] = useState([]);

  useEffect(() => {
    const fetchAll = async () => {
      const [live, daily, name, rs, cls] = await Promise.all([
        fetch('/api/live-count').then(r => r.json()),
        fetch('/api/daily-unique').then(r => r.json()),
        fetch('/api/name-analysis').then(r => r.json()), // This API returns { commonInitial, topKeys }
        fetch('/api/rssi-histogram').then(r => r.json()),
        fetch('/api/class-distribution').then(r => r.json()),
      ]);
      setLive(live.liveCount);
      setDaily(daily.dailyCount);
      setName(name); // `name` should be { commonInitial, topKeys }
      setRssi(rs);
      setCls(cls);
    };
    fetchAll();
    const iv = setInterval(fetchAll, 10000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8 bg-gradient-to-br from-slate-50 to-sky-100 font-sans text-slate-800">
      <header className="text-center py-6 mb-6 md:mb-10">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold uppercase tracking-wide text-[#010F4F]">
          📡 UbiComp Live Presence
        </h1>
        <p className="mt-3 max-w-xl mx-auto text-sm sm:text-base text-[#010F4F] font-semibold">
          Real-time visibility & actionable analytics for pervasive computing environments.
        </p>
        <div className="mt-4 space-y-1 text-gray-600 text-xs sm:text-sm">
          <p>CEID_NE576 — Pervasive Computing Laboratory Exercise 2024/25</p>
          <p>Καθ. Andreas Komninos — Ομάδα: Ορέστης Αντώνης Μακρής (AM 1084516)</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <Card className="hover:scale-[1.02] focus-within:scale-[1.02]">
          <CardHeader>
            <CardTitle className="text-sky-700">👥 Πλήθος Παρόντων Τώρα</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl md:text-5xl font-semibold text-sky-900">{liveCount}</p>
          </CardContent>
        </Card>

        <Card className="hover:scale-[1.02] focus-within:scale-[1.02]">
          <CardHeader>
            <CardTitle className="text-emerald-700">📅 Μοναδικοί Επισκέπτες Σήμερα</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl md:text-5xl font-semibold text-emerald-900">{dailyCount}</p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 lg:col-span-1 hover:scale-[1.02] focus-within:scale-[1.02]">
          <CardHeader>
            <CardTitle className="text-indigo-700">🔤 Ανάλυση Ονομάτων Συσκευών</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base md:text-lg">
              Πιο συχνό αρχικό: <strong className="text-indigo-900">{nameAnalysis.commonInitial || 'N/A'}</strong>
            </p>
            {nameAnalysis.topKeys && nameAnalysis.topKeys.length > 0 && (
              <p className="text-base md:text-lg mt-1">
                Top Keywords: <strong className="text-indigo-900">{nameAnalysis.topKeys.join(', ')}</strong>
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2 hover:scale-[1.02] focus-within:scale-[1.02]">
          <CardHeader>
            <CardTitle className="text-rose-700">📶 Κατανομή RSSI</CardTitle>
          </CardHeader>
          <CardContent>
            <BarResp width="100%" height={230}>
              <BarChart data={rssi} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                <XAxis dataKey="range" tick={{ fontSize: 12, fill: '#475569' }} />
                <YAxis tick={{ fontSize: 12, fill: '#475569' }} />
                <BarTip cursor={{ fill: 'rgb(9, 38, 163)' }} />
                <Bar dataKey="count" fill={BAR_CHART_FILL_COLOR} radius={[6, 6, 0, 0]} />
              </BarChart>
            </BarResp>
          </CardContent>
        </Card>

        <Card className="md:col-span-1 lg:col-span-3 hover:scale-[1.02] focus-within:scale-[1.02]"> {/* Adjusted to span full on lg for better visibility or keep as 1 */}
          <CardHeader>
            <CardTitle className="text-amber-700">📊 Κατανομή Κατηγοριών Συσκευών</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center items-center">
            <PieResp width="100%" height={230}>
              <PieChart>
                <Pie
                  data={clsDist}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  dataKey="value"
                  paddingAngle={2}
                  labelLine={false}
                >
                  {clsDist.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <PieTip />
              </PieChart>
            </PieResp>
          </CardContent>
        </Card>
      </div>
      <footer className="text-center text-sm sm:text-base text-[#010F4F] font-bold uppercase tracking-wider mt-10 md:mt-16 py-6 border-t border-slate-300/60">
        © {new Date().getFullYear()} UbiComp • University of Patras • Designed by Orestis Makris
      </footer>
    </div>
  );
}