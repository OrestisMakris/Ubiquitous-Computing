import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function DashboardThree() {
  const [lastSeen, setLastSeen] = useState([]);
  const [cooccur,  setCooccur]  = useState([]);
  const [routine,  setRoutine]  = useState([]);

  useEffect(() => {
    let mounted = true;
    async function fetchAll() {
      const [ls, co, rt] = await Promise.all([
        fetch('/api/pattern-last-seen').then(r => r.json()),
        fetch('/api/pattern-cooccur').then(r => r.json()),
        fetch('/api/pattern-routine').then(r => r.json()),
      ]);
      if (!mounted) return;
      setLastSeen(ls);
      setCooccur(co);
      setRoutine(rt);
    }
    fetchAll();
    const iv = setInterval(fetchAll, 10000);
    return () => { mounted = false; clearInterval(iv); };
  }, []);

  // group everything by device_name
  const patterns = [
    ...cooccur .map(p => ({ ...p, type: 'cooccur'   })),
    ...routine .map(p => ({ ...p, type: 'routine'   }))
  ];
  const grouped = patterns.reduce((acc, { pseudonym, device_name, type, message }) => {
    if (!acc[device_name]) {
      acc[device_name] = {
        device_name,
        last_seen:    [],   // real lines
        cooccur:      [],
        routine:      []
      };
    }
    acc[device_name][type].push(message);
    return acc;
  }, {});

  // inject real lastSeen messages
  lastSeen.forEach(r => {
    if (!grouped[r.device_name]) {
      grouped[r.device_name] = {
        device_name: r.device_name,
        last_seen:   [],
        cooccur:     [],
        routine:     []
      };
    }
    // put the real “📍 Last Seen” at the top
    grouped[r.device_name].last_seen.unshift(r.message);
  });

  const allDevices = Object.values(grouped);

  // split real vs fake by presence in lastSeen
  const realNames = new Set(lastSeen.map(r => r.device_name));
  const realDevices = allDevices.filter(d => realNames.has(d.device_name));
  const fakeDevices = allDevices
    .filter(d => !realNames.has(d.device_name))
    .slice(0, 20 - realDevices.length);

  const visible = [...realDevices, ...fakeDevices];

  return (
    <div>
      <header className="text-center py-4">
        <h2 className="text-3xl font-bold">Active Surveillance Profiles</h2>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visible.map((dev, i) => (
          <Card key={i}>
            <CardHeader>
              <CardTitle>
                <strong className="text-blue-600">{dev.device_name}</strong>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <h4 className="font-semibold">Movement Patterns</h4>
                {dev.last_seen.length
                  ? dev.last_seen.map((m,j) => (
                      <div key={j} className="flex items-center py-1">
                        <span>📍</span><span className="ml-2">{m}</span>
                      </div>
                    ))
                  : <p className="text-gray-500">— none —</p>
                }
              </div>
              <div className="mt-4">
                <h4 className="font-semibold">Social Insights</h4>
                {dev.cooccur.map((m,j) => (
                  <div key={j} className="flex items-center py-1">
                    <span>👥</span><span className="ml-2">{m}</span>
                  </div>
                ))}
                {dev.routine.map((m,j) => (
                  <div key={j} className="flex items-center py-1">
                    <span>⏱️</span><span className="ml-2">{m}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}