
import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Wifi, MapPin } from 'lucide-react';

import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer as BarResp
} from 'recharts';
 
const RSSI_CENTER_PLOT = -30; // Strongest signal (closest to center)
const RSSI_EDGE_PLOT   = -90; // Weakest signal (at the edge of the plot area)
const BUBBLE_DIAMETER = 20;         // smaller, less “dynamic” size
const CENTER_DOT_DIAMETER = 8;      // a bit smaller center marker

export default function DashboardTwo() {
  const [devices, setDevices] = useState([])
  const [hist, setHist]       = useState([])

  useEffect(() => {
    const fetchAll = async () => {
      try {
        // fetch visible devices and recent events in parallel
        const [visRes, evRes] = await Promise.all([
          fetch('/api/visible-devices').then(r => r.ok ? r.json() : Promise.reject(r.status)),
          fetch('/api/device-events').then(r => r.ok ? r.json() : Promise.reject(r.status))
        ])
        const visDevices = Array.isArray(visRes.devices) ? visRes.devices : []
        setDevices(visDevices)

        // build 6‐bin histogram over last 15′
        const now = Date.now()
        const BIN_COUNT = 6
        const BIN_SIZE_MIN = 15 / BIN_COUNT // 2.5 minutes
        const labels = ['-15′','-12′','-10′','-7′','-5′','-2′']
        const bins = labels.map(t => ({ time: t, count: 0 }))
        if (evRes.events && Array.isArray(evRes.events)) {
          evRes.events.forEach(e => {
            const diffMin = (now - new Date(e.timestamp)) / 60000
            if (diffMin < 15) {
              const idx = Math.min(
                BIN_COUNT - 1,
                Math.floor(diffMin / BIN_SIZE_MIN)
              )
              // reverse index so oldest bin at left
              bins[BIN_COUNT - 1 - idx].count++
            }
          })
        }
        setHist(bins)
      } catch (err) {
        console.error('DashboardTwo fetch error:', err)
        setDevices([])
        setHist(labels.map(t => ({ time: t, count: 0 })))
      }
    }

    fetchAll()
    const interval = setInterval(fetchAll, 5000)
    return () => clearInterval(interval)
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
    <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>⏱️ Οπτικοποίηση Πρόσφατης Δραστηριότητας</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-2 text-sm text-gray-600">
            Μια χρονογραμμή με ανώνυμα “blips” που δείχνουν γεγονότα ανίχνευσης
            συσκευών τα τελευταία ~15′. Κάθε bar απεικονίζει ένταση σήματος,
            όχι “νέα” συσκευή.
          </p>
          <BarResp width="100%" height={150}>
            <BarChart data={hist}>
              <XAxis dataKey="time" tick={{ fontSize: 10 }} />
              <YAxis hide domain={[0, 'dataMax']} />
              <Tooltip />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {hist.map((entry, i) => {
                  const alpha = 0.3 + (i / (hist.length - 1)) * 0.7
                  const fill = `rgba(0,23,73,${alpha.toFixed(2)})`
                  return <Cell key={i} fill={fill} />
                })}
              </Bar>
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