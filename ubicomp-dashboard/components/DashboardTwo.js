import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Wifi, MapPin } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer as BarResp
} from 'recharts';


const RSSI_CENTER_PLOT = -30; // Strongest signal (closest to center)
const RSSI_EDGE_PLOT = -90;   // Weakest signal (at the edge of the plot area)
const BUBBLE_DIAMETER = 20;         // smaller, less “dynamic” size
const CENTER_DOT_DIAMETER = 8;      // a bit smaller center marker

export default function DashboardTwo() {
  const [devices, setDevices] = useState([]);
  const [hist, setHist]     = useState([]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [vis, ev] = await Promise.all([
          fetch('/api/visible-devices').then(r => {
            if (!r.ok) throw new Error(`Failed to fetch visible-devices: ${r.status}`);
            return r.json();
          }),
          fetch('/api/device-events').then(r => {
            if (!r.ok) throw new Error(`Failed to fetch device-events: ${r.status}`);
            return r.json();
          })
        ]);

        console.log("Fetched visible devices:", vis.devices); // LOG 1: Check fetched devices and their RSSI
        setDevices(vis.devices || []); // Ensure devices is always an array

        // build 15-minute histogram (existing code)
        const now = Date.now();
        const bins = Array.from({ length: 15 }, (_, i) => ({
          time: `${-(15 - i)}′`, count: 0
        }));
        if (ev.events && Array.isArray(ev.events)) {
          ev.events.forEach(e => {
            const diff = Math.floor((now - new Date(e.timestamp)) / 60000);
            if (diff < 15) {
              bins[bins.length - 1 - diff].count++;
            }
          });
        }
        setHist(bins);
      } catch (error) {
        console.error("Error fetching data for DashboardTwo:", error);
        setDevices([]); // Clear devices on error
        setHist(Array.from({ length: 15 }, (_, i) => ({ time: `${-(15 - i)}′`, count: 0 }))); // Reset hist
      }
    };
    fetchAll();
    const iv = setInterval(fetchAll, 5000);
    return () => clearInterval(iv);
  }, [])

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
                      <span
                        style={{
                          fontSize: '1.5rem',    // text-2xl
                          lineHeight: '2rem',    // text-2xl
                          fontWeight: '700',     // font-bold
                          color: 'rgb(0, 19, 159)',       // text-black
                        }}
                      >
                        {d.name}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: '1.5rem',    // text-2xl
                        lineHeight: '2rem',    // text-2xl
                        color: 'rgb(64, 0, 107)',       // text-black
                        fontWeight: '600',     // font-semibold
                      }}
                    >
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

<Card>
  <CardHeader>
    <CardTitle>📶 Proximity (Closer to center = stronger signal)</CardTitle>
  </CardHeader>
  {/* make CardContent a flex‐column centered container */}
  <CardContent className="flex flex-col items-center">
    {/* svg wrapper */}
    <div className="flex items-center justify-center w-full py-6">
      <svg
        width={256}
        height={256}
        viewBox="0 0 256 256"
        className="mx-auto"
      >
        {/* outer circle */}
        <circle cx="128" cy="128" r="120" fill="#C7D2FE" />
        {/* center dot */}
        <circle
          cx="128"
          cy="128"
          r={CENTER_DOT_DIAMETER / 2}
          fill="red"
        />
        {devices
          .filter(d => typeof d.rssi === "number")
          .map((d, i, arr) => {
            const range = RSSI_CENTER_PLOT - RSSI_EDGE_PLOT;
            const clamped = Math.max(RSSI_EDGE_PLOT, Math.min(RSSI_CENTER_PLOT, d.rssi));
            const norm = (clamped - RSSI_EDGE_PLOT) / range;
            const maxR = 120 - BUBBLE_DIAMETER / 2;
            const dist = (1 - norm) * maxR;
            const angle = ((360 / arr.length) * i + 45) * (Math.PI / 180);
            const x = 128 + dist * Math.cos(angle);
            const y = 128 + dist * Math.sin(angle);

            return (
              <circle
                key={d.pseudonym}
                cx={x}
                cy={y}
                r={BUBBLE_DIAMETER / 2}
                fill="rgb(0, 9, 78)"
                stroke="#fff"
                strokeWidth="1"
              />
            );
          })}
      </svg>
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