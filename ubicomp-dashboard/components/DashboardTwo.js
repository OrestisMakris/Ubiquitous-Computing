import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Wifi, MapPin } from 'lucide-react';

const PRIMARY = '#0017a5';

// Μορφοποίηση διάρκειας σε s/m
const formatDuration = seconds => {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s === 0 ? `${m}m` : `${m}m ${s}s`;
};

// Οπτική ομαδοποίηση βάσει RSSI
const ProximityClusters = ({ groups }) => {
  const { near = [], mid = [], far = [] } = groups;
  const rings = [40, 60, 80];
  const all = [
    ...near.map(n => ({ name: n, group: 'near' })),
    ...mid.map(n => ({ name: n, group: 'mid' })),
    ...far.map(n => ({ name: n, group: 'far' }))
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
      {rings.map((r, i) => (
        <div key={i}
             className="absolute rounded-full border border-gray-300"
             style={{
               width: `${r}%`, height: `${r}%`,
               transform: 'translate(-50%,-50%)'
             }} />
      ))}
      <div className="absolute text-sm font-semibold" style={{ color: PRIMARY }}>
        SCANNER
      </div>
      {all.map((d, i) => {
        const radius = rings[d.group === 'near' ? 0 : d.group === 'mid' ? 1 : 2] / 2;
        const pos = getPos(i, all.length, radius);
        return (
          <div key={`${d.group}-${d.name}-${i}`}
               title={d.name}
               className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
               style={pos}>
            <div className="w-5 h-5 bg-emerald-500 rounded-full shadow-md" />
            <span className="mt-1 text-xs bg-white px-1 rounded">
              {d.name.length > 10 ? `${d.name.slice(0,10)}…` : d.name}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// Χρονογραμμή πρόσφατης δραστηριότητας
const ActivityTimelineChart = ({ events }) => {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  const bins = 5;
  const size = windowMs / bins;
  const data = Array.from({ length: bins }).map((_, i) => ({
    count: 0,
    label: i === bins - 1 ? 'Now' : `-${15 - i*3}m`,
    start: now - windowMs + i*size,
    end:   now - windowMs + (i+1)*size
  }));

  events.forEach(({ timestamp }) => {
    const idx = Math.min(bins-1, Math.floor((timestamp - (now - windowMs)) / size));
    if (idx >= 0) data[idx].count++;
  });
  const max = Math.max(...data.map(d => d.count), 1);

  return (
    <div className="h-48 flex items-end justify-around p-4 bg-white rounded-lg relative">
      {data.map((d,i) => (
        <div key={i} className="flex flex-col items-center w-1/6">
          <div title={`${d.count} detections`}
               className="w-full rounded-t"
               style={{
                 height: `${(d.count/max)*100}%`,
                 background: PRIMARY
               }} />
          <span className="text-xs mt-1 text-gray-600">{d.label}</span>
        </div>
      ))}
      <p className="absolute top-2 left-4 text-sm text-gray-500">
        Σημάδια ανίχνευσης ανά 3′ στα τελευταία 15′
      </p>
    </div>
  );
};

export default function DashboardTwo() {
  const [devices, setDevices] = useState([]);
  const [groups, setGroups]   = useState({});
  const [events, setEvents]   = useState([]);
  const [newDevices, setNewDevices] = useState([]);
  const prevNames = useRef([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const [cur, grp, evt] = await Promise.all([
        fetch('/api/current-devices').then(r => r.json()),
        fetch('/api/rssi-current-groups').then(r => r.json()),
        fetch('/api/device-events').then(r => r.json())
      ]);
      if (!mounted) return;
      setDevices(cur.devices);
      const names = cur.devices.map(d => d.name);
      const added = names.filter(n => !prevNames.current.includes(n));
      setNewDevices(added);
      prevNames.current = names;
      setGroups(grp);
      setEvents(evt.events);
    };
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

      {/* Welcome νέων συσκευών */}
      {newDevices.length > 0 && (
        <Card className="mx-auto max-w-md bg-blue-50 border-blue-200 border">
          <CardContent>
            {newDevices.map(name => (
              <p key={name} className="text-center text-lg text-[#0017a5] font-semibold">
                Καλωσήρθες <strong>{name}</strong>!
              </p>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Current Devices */}
        <Card>
          <CardHeader className="flex justify-between border-b-2 border-[#0017a5]">
            <CardTitle className="text-lg">🔹 Συσκευές Παρούσες Τώρα</CardTitle>
            <Wifi color={PRIMARY} />
          </CardHeader>
          <CardContent className="max-h-80 overflow-y-auto">
            <ul>
              {devices.map(d => (
                <li key={d.name} className="flex justify-between items-center py-1">
                  <span className={d.duration < 300
                    ? "text-[#0017a5] font-semibold"
                    : "text-gray-800"}>
                    {d.name}
                  </span>
                  {d.duration < 300 && (
                    <span className="ml-2 px-2 py-0.5 bg-yellow-200 text-yellow-800 text-xs rounded">
                      Νέο!
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Proximity Clusters */}
        <Card>
          <CardHeader className="flex justify-between border-b-2 border-[#0017a5]">
            <CardTitle className="text-lg">🔹 Ομαδοποίηση Εγγύτητας</CardTitle>
            <MapPin color={PRIMARY} />
          </CardHeader>
          <CardContent>
            <ProximityClusters groups={groups} />
          </CardContent>
        </Card>

        {/* Recent Detection Timeline */}
        <Card className="md:col-span-2">
          <CardHeader className="border-b-2 border-[#0017a5]">
            <CardTitle className="text-lg">🔹 Χρονολόγιο Ανιχνεύσεων</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityTimelineChart events={events} />
          </CardContent>
        </Card>

        {/* Session Durations */}
        <Card className="md:col-span-2">
          <CardHeader className="border-b-2 border-[#0017a5]">
            <CardTitle className="text-lg">🔹 Διάρκεια Συνεδρίας</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {devices.map(d => (
              <p key={d.name} className="text-sm text-gray-700">
                "{d.name}" ανιχνεύθηκε για περίπου {formatDuration(d.duration)}.
              </p>
            ))}
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