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
        <div key={idx} className="absolute rounded-full border border-gray-300" style={{ width: `${r}%`, height: `${r}%`, transform: 'translate(-50%, -50%)' }} />
      ))}
      <div className="absolute text-sm font-semibold" style={{ color: PRIMARY }}>SCANNER</div>
      {all.map((d, i) => {
        const radius = rings[d.group === 'near' ? 0 : d.group === 'mid' ? 1 : 2] / 2;
        const pos = getPos(i, all.length, radius);
        return (
          <div key={`${d.group}-${d.name}-${i}`} title={d.name}
               className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
               style={pos}>
            <div className="w-5 h-5 bg-emerald-500 rounded-full shadow-md" />
            <span className="mt-1 text-xs" style={{ background: 'white', padding: '1px 4px', borderRadius: '4px' }}>
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
    end:   now - windowMs + (i + 1) * size
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
          <div title={`${d.count} detections`} className="w-full rounded-t"
               style={{ height: `${(d.count / max) * 100}%`, background: PRIMARY }} />
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
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <header>
        <Card>
          <CardHeader style={{ background: PRIMARY, color: 'white' }}>
            <CardTitle className="text-2xl">Ο Παρατηρητής Μοτίβων</CardTitle>
            <p className="text-sm opacity-80">Session-based, short‑term visibility</p>
          </CardHeader>
        </Card>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Current Devices */}
        <Card>
          <CardHeader className="flex justify-between" style={{ borderBottom: `2px solid ${PRIMARY}` }}>
            <CardTitle className="text-lg">Συσκευές Παρούσες Τώρα</CardTitle>
            <Wifi color={PRIMARY} />
          </CardHeader>
          <CardContent className="max-h-80 overflow-y-auto">
            {devices.length ? devices.map(d => (
              <div key={d.pseudonym} className="flex justify-between p-2 hover:bg-gray-100 rounded">
                <span className="font-medium text-sm">{d.name}</span>
                <span className="text-xs text-gray-500">{formatDuration(d.duration)}</span>
              }</div>
            )) : <p className="text-center py-10 text-gray-500">No visible devices.</p>}
          </CardContent>
        </Card>

        {/* Proximity Groups */}
        <Card>
          <CardHeader className="flex justify-between" style={{ borderBottom: `2px solid ${PRIMARY}` }}>
            <CardTitle className="text-lg">Ομαδοποίηση κατά Εγγύτητα</CardTitle>
            <MapPin color={PRIMARY} />
          </CardHeader>
          <CardContent><ProximityClusters groups={groups} /></CardContent>
        </Card>

        {/* Recent Detection Timeline */}
        <Card>
          <CardHeader className="flex justify-between" style={{ borderBottom: `2px solid ${PRIMARY}` }}>
            <CardTitle className="text-lg">Recent Detection Timeline</CardTitle>
            <Clock color={PRIMARY} />
          }</CardHeader>
          <CardContent>
            {events.length ? <ActivityTimelineChart events={events} /> : <p className="text-center py-10 text-gray-500">No recent events.</p>}
          </CardContent>
        </Card>

        {/* Session Overview */}
        <Card>
          <CardHeader className="flex justify-between" style={{ borderBottom: `2px solid ${PRIMARY}` }}>
            <CardTitle className="text-lg">Επισκόπηση Συνεδρίας</CardTitle>
            <BarChart2 color={PRIMARY} />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between"><span>Συνολικές Μοναδικές Συσκευές:</span><span className="font-semibold">{metrics.unique}</span></div>
            <div className="flex justify-between"><span>Μεγαλύτερη Διάρκεια Παρουσίας:</span><span className="font-semibold">{formatDuration(metrics.maxDuration)}</span></div>
          </CardContent>
        </Card>
      </div>

      <footer className="text-center text-xs text-gray-500">
        <AlertTriangle color="orange" className="inline mr-1" />Σημείωση: Αυτή η συνεδρία θα γίνει επαναφορά σύντομα.
      </footer>
    </div>
  );
}