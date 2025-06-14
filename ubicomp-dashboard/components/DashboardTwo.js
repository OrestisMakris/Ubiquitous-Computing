import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Wifi } from 'lucide-react'; // MapPin might not be needed if not used elsewhere

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
const BUBBLE_DIAMETER = 16; // Updated from previous step
const CENTER_DOT_DIAMETER = 8; // Updated from previous step

export default function DashboardTwo() {
  const [devices, setDevices] = useState([])
  const [hist, setHist]       = useState([])
  // State for the new Session Overview card
  const [sessionOverviewData, setSessionOverviewData] = useState({ totalUnique: 0, longestPresent: 0 });

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [visRes, evRes] = await Promise.all([
          fetch('/api/visible-devices').then(r => r.ok ? r.json() : Promise.reject(r.status)),
          fetch('/api/device-events').then(r => r.ok ? r.json() : Promise.reject(r.status))
        ]);
        const visDevices = Array.isArray(visRes.devices) ? visRes.devices : [];
        setDevices(visDevices);

        // Calculate data for Session Overview
        const totalUnique = visDevices.length;
        const longestPresentSec = visDevices.length > 0 ? Math.max(0, ...visDevices.map(d => d.duration)) : 0;
        const longestPresentMin = Math.floor(longestPresentSec / 60);
        setSessionOverviewData({ totalUnique, longestPresent: longestPresentMin });

        // build 6‐bin histogram (existing code)
        const now = Date.now();
        const BIN_COUNT = 6;
        const BIN_SIZE_MIN = 15 / BIN_COUNT; // 2.5 minutes
        const labels = ['-15′','-12′','-10′','-7′','-5′','-2′'];
        const bins = labels.map(t => ({ time: t, count: 0 }));
        if (evRes.events && Array.isArray(evRes.events)) {
          evRes.events.forEach(e => {
            const diffMin = (now - new Date(e.timestamp)) / 60000;
            if (diffMin < 15) {
              const idx = Math.min(
                BIN_COUNT - 1,
                Math.floor(diffMin / BIN_SIZE_MIN)
              );
              bins[BIN_COUNT - 1 - idx].count++;
            }
          });
        }
        setHist(bins);
      } catch (err) {
        console.error('DashboardTwo fetch error:', err);
        setDevices([]);
        setSessionOverviewData({ totalUnique: 0, longestPresent: 0 }); // Reset on error
        const labels = ['-15′','-12′','-10′','-7′','-5′','-2′']; // ensure labels is defined for error case
        setHist(labels.map(t => ({ time: t, count: 0 })));
      }
    };

    fetchAll();
    const interval = setInterval(fetchAll, 5000);
    return () => clearInterval(interval);
  }, []);

  // prepare proximity groups (if still needed, otherwise can be removed if not used)
  // const groups = devices.reduce((acc, d) => {
  //   if (!acc[d.group]) acc[d.group] = []; // Ensure group array exists
  //   acc[d.group].push(d);
  //   return acc;
  // }, { near: [], mid: [], far: [] });


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

      {/* Adjusted grid to md:grid-cols-3 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                            paddingLeft: '0.75rem',
                            paddingRight: '0.75rem',
                            paddingTop: '0.25rem',
                            paddingBottom: '0.25rem',
                            backgroundColor: '#fee2e2',
                            color: '#dc2626',
                            borderRadius: '0.5rem',
                            fontSize: '1rem',
                            lineHeight: '1.5rem',
                            fontWeight: '700',
                            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                          }}
                        >
                          Νέα!
                        </span>
                      )}
                      <span
                        style={{
                          fontSize: '1.5rem',
                          lineHeight: '2rem',
                          fontWeight: '700',
                          color: 'rgb(0, 19, 159)',
                        }}
                      >
                        {d.name}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: '1.5rem',
                        lineHeight: '2rem',
                        color: 'rgb(64, 0, 107)',
                        fontWeight: '600',
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

        {/* === NEW Session Overview Card === */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium">Session Overview</CardTitle>
            <Wifi className="h-5 w-5 text-gray-400" /> {/* Icon color adjusted */}
          </CardHeader>
          <CardContent className="space-y-3 pt-4"> {/* Adjusted padding */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-700">Total Unique Devices:</p>
              <p className="text-xl font-bold text-amber-600">{sessionOverviewData.totalUnique}</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-700">Longest Present:</p>
              <p className="text-xl font-bold text-amber-600">
                {sessionOverviewData.longestPresent} min
              </p>
            </div>
          </CardContent>
        </Card>
        {/* === END NEW Session Overview Card === */}

        {/* Proximity Clusters Card */}
        <Card>
          <CardHeader>
            <CardTitle>📶 Ομαδοποίηση Κατ’ Εγγύτητα</CardTitle> {/* Title updated to Greek */}
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="flex items-center justify-center w-full py-6">
              <svg
                width={256}
                height={256}
                viewBox="0 0 256 256"
                className="mx-auto"
              >
                <circle cx="128" cy="128" r="120" fill="#C7D2FE" />
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
            <p className="text-center text-xs text-gray-500 mt-1"> {/* Adjusted margin */}
              Closer to center = stronger signal
            </p>
          </CardContent>
        </Card>
        
        {/* Recent Detection Timeline Card - adjusted to md:col-span-3 */}
        <Card className="md:col-span-3">
            <CardHeader>
            <CardTitle>⏱️ Οπτικοποίηση Πρόσφατης Δραστηριότητας</CardTitle>
            </CardHeader>
            <CardContent>
            <p className="mb-2 text-sm text-gray-600">
                Μια χρονογραμμή με ανώνυμα “blips” που δείχνουν γεγονότα ανίχνευσης
                συσκευών τα τελευταία ~15′. Κάθε bar απεικονίζει ένταση ανιχνεύσεων,
                όχι “νέα” συσκευή.
            </p>
            <BarResp width="100%" height={150}>
                <BarChart data={hist}>
                <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                <YAxis hide domain={[0, 'dataMax']} />
                <Tooltip />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {hist.map((entry, i) => {
                    // Ensure hist.length is not 1 to avoid division by zero if only one bin
                    const alphaDenominator = hist.length > 1 ? hist.length - 1 : 1;
                    const alpha = 0.3 + (i / alphaDenominator) * 0.7;
                    const fill = `rgba(0,23,73,${alpha.toFixed(2)})`;
                    return <Cell key={`cell-${i}`} fill={fill} />; // Added unique key prefix
                    })}
                </Bar>
                </BarChart>
            </BarResp>
            </CardContent>
        </Card>
      </div>

      <Card className="mx-auto max-w-lg">
        <CardContent className="pt-6"> {/* Added padding top to CardContent */}
            <p className="text-center text-2xl md:text-3xl font-extrabold text-gray-800">
            🔒 Δεν διατηρούμε μακροχρόνιο ιστορικό. Όλα τα ονόματα εμφανίζονται για λίγα δευτερόλεπτα μόνο.
          </p>
        </CardContent>
      </Card>
            <footer className="text-center text-sm text-gray-400">
        ©&nbsp;2025&nbsp;|&nbsp;CEID_NE576 —&nbsp;Ubiquitous Computing Live Exercise<br/>
        👤&nbsp;Ορέστης&nbsp;Αντώνης&nbsp;Μακρής&nbsp;(AM&nbsp;1084516)
      </footer>
    </div>
  );
}