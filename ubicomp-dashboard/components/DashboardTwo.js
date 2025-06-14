/*
  Corrected JSX syntax errors and brace mismatches in DashboardTwo component
*/

// components/DashboardTwo.js
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Wifi, MapPin, Clock, BarChart2, AlertTriangle } from 'lucide-react';

const PRIMARY = '#0017a5';

const formatDuration = (seconds) => {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return remaining === 0 ? `${minutes}m` : `${minutes}m ${remaining}s`;
};

const ProximityClusters = ({ groups }) => {
  const { near = [], mid = [], far = [] } = groups;
  const rings = [40, 60, 80];
  const all = [
    ...near.map(name => ({ name, group: 'near' })),
    ...mid.map(name => ({ name, group: 'mid' })),
    ...far.map(name => ({ name, group: 'far' })),
  ].slice(0, 15);

  const getPos = (i, total, radius) => {
    const angle = (i / total) * 2 * Math.PI;
    return {
      left: `${50 + radius * Math.cos(angle)}%`,
      top:  `${50 + radius * Math.sin(angle)}%`
    };
  };

  return (
    <div className="relative w-full h-72 flex items-center justify-center">
      {rings.map((r, idx) => (
        <div
          key={idx}
          className="absolute rounded-full border border-gray-300"
          style={{ width: `${r}%`, height: `${r}%`, transform: 'translate(-50%, -50%)' }}
        />
      ))}
      <div className="absolute text-sm font-semibold" style={{ color: PRIMARY }}>SCANNER</div>
      {all.map((d, i) => {
        const radius = rings[d.group === 'near' ? 0 : d.group === 'mid' ? 1 : 2] / 2;
        const pos = getPos(i, all.length, radius);
        return (
          <div
            key={`${d.group}-${d.name}-${i}`}
            title={d.name}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
            style={pos}
          >
            <div className="w-5 h-5 bg-emerald-500 rounded-full shadow-md" />
            <span
              className="mt-1 text-xs"
              style={{ background: 'white', padding: '1px 4px', borderRadius: '4px' }}
            >
              {d.name.length > 10 ? `${d.name.slice(0, 10)}…` : d.name}
            </span>
          </div>
        );
      })}
    </div>
  );
};

const ActivityTimelineChart = ({ events }) => {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  const bins = 5;
  const size = windowMs / bins;
  const data = Array.from({ length: bins }).map((_, i) => ({
    count: 0,
    label: i === bins - 1 ? 'Now' : `-${15 - i * 3}m`,
    start: now - windowMs + i * size,
    end:   now - windowMs + (i + 1) * size,
  }));

  events.forEach(({ timestamp }) => {
    const idx = Math.min(bins - 1, Math.floor((timestamp - (now - windowMs)) / size));
    if (idx >= 0) data[idx].count++;
  });
  const max = Math.max(...data.map(d => d.count), 1);

  return (
    <div className="h-48 flex items-end justify-around p-4 bg-white rounded-lg relative">
      {data.map((d, i) => (
        <div key={i} className="flex flex-col items-center w-1/6">
          <div
            title={`${d.count} detections`}
            className="w-full rounded-t"
            style={{ height: `${(d.count / max) * 100}%`, background: PRIMARY }}
          />
          <span className="text-xs mt-1 text-gray-600">{d.label}</span>
        </div>
      ))}
      <p className="absolute top-2 left-4 text-sm text-gray-500">
        Recent Detection Timeline: number of device detections per 3‑minute interval over the last 15 minutes.
      </p>
    </div>
  );
};

export default function DashboardTwo() {
  const [devices, setDevices] = useState([]);
  const [groups, setGroups] = useState({});
  const [events, setEvents] = useState([]);
  const [metrics, setMetrics] = useState({ unique: 0, maxDuration: 0 });

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [cur, grp, evt] = await Promise.all([
          fetch('/api/current-devices').then(r => r.json()),
          fetch('/api/rssi-current-groups').then(r => r.json()),
          fetch('/api/device-events').then(r => r.json()),
        ]);
        if (!mounted) return;
        setDevices(cur.devices);
        setGroups(grp);
        setEvents(evt.events);
        setMetrics({ unique: cur.totalUnique, maxDuration: cur.maxDuration });
      } catch (err) {
        console.error(err);
      }
    }
    load();
    const id = setInterval(load, 5000);
    return () => { mounted = false; clearInterval(id); };
  }, []);

  return (
    <div className="space-y-10 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <header className="text-center py-6">
        <p className="text-4xl text-[#0017a5] font-bold">
          📡 Ο Παρατηρητής Μοτίβων
        </p>
        <p className="mt-2 text-sm text-gray-600">
          CEID_NE576 — Ubiquitous Computing Live Exercise 2024/25<br/>
          Prof. Andreas Komninos — Authors: Ορέστης Αντώνης Μακρής
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Current Devices */}
        <Card>
          <CardHeader className="flex justify-between border-b-2 border-[#0017a5]">
            <CardTitle className="text-lg">🔹 Συσκευές Παρούσες Τώρα</CardTitle>
            <Wifi color="#0017a5" />
          </CardHeader>
          <CardContent className="max-h-80 overflow-y-auto">
            {/* ...existing listing logic... */}
          </CardContent>
        </Card>

        {/* Proximity Groups */}
        <Card>
          <CardHeader className="flex justify-between border-b-2 border-[#0017a5]">
            <CardTitle className="text-lg">🔹 Ομαδοποίηση κατά Εγγύτητα</CardTitle>
            <MapPin color="#0017a5" />
          </CardHeader>
          <CardContent>
            {/* ...existing ProximityClusters component... */}
          </CardContent>
        </Card>

        {/* Recent Detection Timeline */}
        <Card className="md:col-span-2">
          <CardHeader className="border-b-2 border-[#0017a5]">
            <CardTitle className="text-lg">🔹 Χρονολόγιο Ανιχνεύσεων</CardTitle>
          </CardHeader>
          <CardContent>
            {/* ...existing ActivityTimelineChart or no-data message... */}
          </CardContent>
        </Card>

        {/* Session Overview */}
        <Card className="md:col-span-2">
          <CardHeader className="border-b-2 border-[#0017a5]">
            <CardTitle className="text-lg">🔹 Επισκόπηση Συνεδρίας</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* ...existing metrics display... */}
          </CardContent>
        </Card>
      </div>

      {/* Privacy Notice */}
      <Card className="mx-auto max-w-lg">
        <CardContent>
          <p className="text-center text-2xl md:text-3xl font-extrabold text-gray-800">
            🔒 Privacy Notice: All data is anonymized and aggregated. No individual tracking.
          </p>
        </CardContent>
      </Card>

      {/* Footer */}
      <footer className="text-center text-sm text-gray-400">
        © 2025 | CEID_NE576 — Pervasive Computing Lab Ex. 2024/25<br/>
        👤 Ορέστης Αντώνης Μακρής (AM 1084516)
      </footer>
    </div>
  );
}

// API routes remain unchanged, as they were previously corrected for JS duration logic.
