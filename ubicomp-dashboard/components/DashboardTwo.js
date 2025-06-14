import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Wifi, MapPin } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer as BarResp
} from 'recharts';

export default function DashboardTwo() {
  const [devices, setDevices] = useState([]);
  const [hist, setHist]     = useState([]);

  useEffect(() => {
    const fetchAll = async () => {
      const [vis, ev] = await Promise.all([
        fetch('/api/visible-devices').then(r => r.json()),
        fetch('/api/device-events').then(r => r.json())
      ]);
      setDevices(vis.devices);

      // build 15-minute histogram
      const now = Date.now();
      const bins = Array.from({ length: 15 }, (_, i) => ({
        time: `${-(15 - i)}′`, count: 0
      }));
      ev.events.forEach(e => {
        const diff = Math.floor((now - new Date(e.timestamp)) / 60000);
        if (diff < 15) {
          bins[bins.length - 1 - diff].count++;
        }
      });
      setHist(bins);
    };
    fetchAll();
    const iv = setInterval(fetchAll, 5000);
    return () => clearInterval(iv);
  }, []);

  // prepare proximity groups
  const groups = devices.reduce((acc, d) => {
    acc[d.group].push(d);
    return acc;
  }, { near: [], mid: [], far: [] });

  return (
    <div className="space-y-10">
      <header className="text-center py-6">
        <p className="text-4xl text-[#0017a5] font-bold">
          🕵️‍♂️ Dashboard Παρατηρητής Μοτίβων
        </p>
        <p className="mt-2 text-sm text-gray-600">
          Παρατηρεί προσωρινά δημόσια ονόματα συσκευών χωρίς μακροχρόνιο ιστορικό
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Devices Currently Visible */}
        <Card>
          <CardHeader>
            <CardTitle>📱 Συσκευές σε Προβολή Τώρα</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-gray-200">
              {devices.map(d => {
                const totalMinutes = Math.floor(d.duration / 60);
                let label;
                if (totalMinutes > 0) {
                  label = `${totalMinutes} min`;
                } else if (d.duration > 0) {
                  label = "<1 min";
                } else {
                  label = "0 min";
                }

                return (
                  <li
                    key={d.pseudonym}
                    className="py-4 flex justify-between items-center"
                  >
                    <div className="flex items-center space-x-3">
                      {d.isNew && (
                        <span
                          style={{
                            paddingLeft: '0.75rem', // px-3
                            paddingRight: '0.75rem', // px-3
                            paddingTop: '0.25rem', // py-1
                            paddingBottom: '0.25rem', // py-1
                            backgroundColor: '#fee2e2', // bg-red-100 (approximate hex for red-100)
                            color: '#dc2626', // text-red-600 (approximate hex for red-600)
                            borderRadius: '0.5rem', // rounded-lg
                            fontSize: '1rem', // text-base (assuming 1rem is your base)
                            lineHeight: '1.5rem', // text-base (assuming 1.5rem line height for base)
                            fontWeight: '700', // font-bold
                            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', // shadow-sm (approximate)
                          }}
                        >
                          Νέα!
                        </span>
                      )}
                      <span className="text-2xl font-bold text-black">
                        {d.name}
                      </span>
                    </div>
                    <span className="text-2xl text-black font-semibold">
                      {label}
                    </span>
                  </li>
                );
              })}
              {devices.length === 0 && (
                <li className="py-4 text-gray-500 italic">Κανένα σήμα προς το παρόν</li>
              )}
            </ul>
          </CardContent>
        </Card>

        {/* 2. Proximity Clusters (Bubble Plot) */}
        <Card>
          <CardHeader>
            <CardTitle>📶 Ομαδοποίηση Κατ’ Εγγύτητα</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative w-full h-48 mx-auto">
              <div className="absolute inset-0 border-2 border-green-200 rounded-full" />
              {devices.map((d, i) => {
                // place each dot at random angle on its ring
                const angle = (360 / devices.length) * i;
                const rad   = (d.group === 'near' ? 20 : d.group === 'mid' ? 35 : 48);
                const xPct  = 50 + rad * Math.cos((angle * Math.PI) / 180);
                const yPct  = 50 + rad * Math.sin((angle * Math.PI) / 180);
                return (
                  <div
                    key={d.pseudonym}
                    title={`${d.name} (${d.rssi} dBm)`}
                    className="absolute w-4 h-4 bg-green-400 rounded-full"
                    style={{ left: `${xPct}%`, top: `${yPct}%`, transform: 'translate(-50%, -50%)' }}
                  />
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* 3. Recent Detection Timeline (Bar Chart) */}
    <Card className="md:col-span-2">
    <CardHeader>
        <CardTitle>⏱️ Χρονογράφημα Σημάτων (τελευταία ~15′)</CardTitle>
    </CardHeader>
    <CardContent>
        <BarResp width="100%" height={150}>
        <BarChart data={hist}>
            {/* only show ticks at -15′, -10′, -5′, -2′, -1′ */}
            <XAxis
            dataKey="time"
            ticks={['-15′','-10′','-5′','-2′','-1′']}
            tick={{ fontSize: 10 }}
            />
            <YAxis domain={[0, 'dataMax']} hide={true} />
            <Tooltip />
            <Bar dataKey="count" fill="#0017a5" radius={[4, 4, 0, 0]} />
        </BarChart>
        </BarResp>
    </CardContent>
    </Card>
      </div>

      <Card className="mx-auto max-w-lg">
        <CardContent>
            <p className="text-center text-2xl md:text-3xl font-extrabold text-gray-800">
            🔒 Δεν διατηρούμε μακροχρόνιο ιστορικό. Όλα τα ονόματα εμφανίζονται για λίγα δευτερόλεπτα μόνο.
          </p>
        </CardContent>
      </Card>
            <footer className="text-center text-sm text-gray-400">
        © 2025 | CEID_NE576 — Ubiquitous Computing Live Exercise<br/>
        👤 Ορέστης Αντώνης Μακρής (AM 1084516)
      </footer>
    </div>
  );
}