import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'; // <-- Add this line
import React, { useState, useEffect, useRef } from 'react';


export default function DashboardTwo() {
  const [current, setCurrent] = useState([]);
  const [groups, setGroups] = useState({ near: [], mid: [], far: [] });
  const [events, setEvents] = useState([]);
  const seenRef = useRef(new Set());

  useEffect(() => {
    let mounted = true;
    async function fetchAll() {
      const [c, g, e] = await Promise.all([
        fetch('/api/current-devices').then(r => r.json()),
        fetch('/api/rssi-current-groups').then(r => r.json()),
        fetch('/api/device-events').then(r => r.json()),
      ]);
      if (!mounted) return;

      // mark new arrivals
      c.devices.forEach(d => {
        if (!seenRef.current.has(d.pseudonym)) {
          seenRef.current.add(d.pseudonym);
          d.isNew = true;
        }
      });

      setCurrent(c.devices);
      setGroups(g);
      setEvents(e);
    }

    fetchAll();
    const iv = setInterval(fetchAll, 5000);
    return () => { mounted = false; clearInterval(iv); };
  }, []);

  // helper to format seconds to mm:ss
  const fmt = s => {
    const m = Math.floor(s/60), ss = s%60;
    return `${m}m ${ss}s`;
  };

  return (
    <div className="space-y-8">
      <header className="text-center py-4">
        <h2 className="text-3xl font-semibold">Ο Παρατηρητής Μοτίβων</h2>
        <p className="text-sm text-gray-500">(Session-based, short‑term visibility)</p>
      </header>

      {/* 1. Live List */}
      <Card>
        <CardHeader><CardTitle>Συσκευές Παρούσες Τώρα</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {current.map(d =>
            <div key={d.pseudonym} className="flex justify-between items-center">
              <span className={`font-medium ${d.isNew ? 'text-green-600' : ''}`}>
                {d.name} {d.isNew && <span className="ml-2 px-1 bg-green-200 text-green-800 rounded">Νέο!</span>}
              </span>
              <span className="text-sm text-gray-500">{fmt(d.duration)}</span>
            </div>
          )}
          {current.length === 0 && <p className="text-gray-500">Κανένα.</p>}
        </CardContent>
      </Card>

      {/* 2. Proximity Groups */}
      <Card>
        <CardHeader><CardTitle>Ομαδοποίηση κατά Εγγύτητα</CardTitle></CardHeader>
        <CardContent className="flex justify-around">
          <div className="space-y-1 text-center">
            <p className="font-semibold">Κοντά</p>
            {groups.near.map(n => <div key={n}>{n}</div>)}
          </div>
          <div className="space-y-1 text-center">
            <p className="font-semibold">Μέτρια</p>
            {groups.mid.map(n => <div key={n}>{n}</div>)}
          </div>
          <div className="space-y-1 text-center">
            <p className="font-semibold">Μακριά</p>
            {groups.far.map(n => <div key={n}>{n}</div>)}
          </div>
        </CardContent>
      </Card>

      {/* 3. Blips Timeline */}
      <Card>
        <CardHeader><CardTitle>Χρονογράφημα Δραστηριότητας</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto whitespace-nowrap py-2">
          {events.map((e,i) => {
            const dt = new Date(e.timestamp);
            const hh = dt.getHours().toString().padStart(2,'0');
            const mm = dt.getMinutes().toString().padStart(2,'0');
            const ss = dt.getSeconds().toString().padStart(2,'0');
            return (
              <span key={i}
                    className="inline-block mx-1 px-2 py-1 bg-blue-100 text-blue-800 rounded">
                • {hh}:{mm}:{ss}
              </span>
            );
          })}
          {events.length === 0 && <p className="text-gray-500">Δεν υπάρχουν πρόσφατα blips.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
