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
          🕵️‍♂️ Ταμπλό Επιπέδου 2: Ο Παρατηρητής Μοτίβων
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
            <ul className="space-y-2">
              {devices.map(d => {
                const label = d.duration < 60
                  ? `${d.duration}s`
                  : `${Math.floor(d.duration / 60)}′`;
                return (
                  <li key={d.pseudonym} className="flex justify-between">
                    <span>
                      {d.name}
                      {d.isNew && (
                        <span className="ml-2 px-1 bg-blue-100 text-blue-800 rounded text-xs">
                          Νέα!
                        </span>
                      )}
                    </span>
                    <span className="text-gray-500">{label}</span>
                  </li>
                );
              })}
              {devices.length === 0 && <li>Κανένα σήμα προς το παρόν</li>}
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
                <XAxis dataKey="time" tick={{ fontSize: 10 }} />
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
          <p className="text-center text-sm text-gray-600">
            🔒 Δεν διατηρούμε μακροχρόνιο ιστορικό. Όλα τα ονόματα εμφανίζονται για λίγα δευτερόλεπτα μόνο.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}