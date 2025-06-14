import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Wifi, MapPin } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer as BarResp
} from 'recharts';
// Constants for the proximity plot
const RSSI_CENTER_PLOT = -30; // Strongest signal (closest to center)
const RSSI_EDGE_PLOT = -90;   // Weakest signal (at the edge of the plot area)
const RSSI_RANGE_PLOT = RSSI_CENTER_PLOT - RSSI_EDGE_PLOT;
const BUBBLE_DIAMETER = 16; // pixels
const BUBBLE_RADIUS = BUBBLE_DIAMETER / 2;


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
                        color: 'rgb(0, 107, 5)',       // text-black
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
            <CardTitle>📶 Ομαδοποίηση Κατ’ Εγγύτητα</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative w-full aspect-square max-w-xs mx-auto"> {/* Made it square and constrained max width */}
              {/* Outer filled circle for the plot area */}
              <div
                className="absolute inset-0 bg-green-100 rounded-full" // Light green filled circle
                style={{
                  // Ensuring the circle doesn't get too small if the card is narrow
                  minWidth: '150px',
                  minHeight: '150px',
                }}
              />
              {devices.map((d, i) => {
                // 1. Normalize RSSI to a 0-1 range (0 for weakest at edge, 1 for strongest at center)
                const rssiRange = RSSI_CENTER_PLOT - RSSI_EDGE_PLOT;
                let normalizedRssi = 0;
                if (rssiRange !== 0) {
                  normalizedRssi = (Math.max(RSSI_EDGE_PLOT, Math.min(RSSI_CENTER_PLOT, d.rssi)) - RSSI_EDGE_PLOT) / rssiRange;
                }
                // Clamp between 0 and 1
                normalizedRssi = Math.max(0, Math.min(1, normalizedRssi));

                // 2. Calculate radial distance (percentage from center)
                // Stronger signal (normalizedRssi closer to 1) means smaller radialDistance
                const radialDistancePercent = (1 - normalizedRssi) * PLOT_AREA_RADIUS_PERCENT;

                // 3. Distribute bubbles by angle
                const angleDegrees = (devices.length > 0 ? (360 / devices.length) * i : 0) + 45; // Offset angle slightly
                const angleRadians = (angleDegrees * Math.PI) / 180;

                // 4. Calculate X and Y percentage positions for the bubble's center
                const xPct = 50 + radialDistancePercent * Math.cos(angleRadians);
                const yPct = 50 + radialDistancePercent * Math.sin(angleRadians);

                return (
                  <div
                    key={d.pseudonym}
                    title={`${d.name} (${d.rssi} dBm)`}
                    className="absolute bg-green-500 rounded-full" // Darker green bubble
                    style={{
                      width: `${BUBBLE_DIAMETER_PX}px`,
                      height: `${BUBBLE_DIAMETER_PX}px`,
                      left: `${xPct}%`,
                      top: `${yPct}%`,
                      transform: 'translate(-50%, -50%)', // Center the bubble on its coordinates
                      transition: 'left 0.5s ease-out, top 0.5s ease-out', // Smooth transition
                    }}
                  />
                );
              })}
              {devices.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-gray-400 italic">No devices</p>
                </div>
              )}
            </div>
            <p className="text-center text-xs text-gray-500 mt-2">
              Closer to center = Closer to scanner (Stronger Signal)
            </p>
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