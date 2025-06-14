import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function DashboardThree() {
  const [lastSeen, setLastSeen] = useState([]);
  const [cooccur,  setCooccur]  = useState([]);
  const [routine,  setRoutine]  = useState([]);

  // fetch & refresh every 10s
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

  // group patterns
  const allPatterns = [
    ...lastSeen.map(p => ({ ...p, pattern_type: 'last_seen' })),
    ...cooccur .map(p => ({ ...p, pattern_type: 'cooccur'   })),
    ...routine .map(p => ({ ...p, pattern_type: 'routine'   }))
  ];
  const grouped = allPatterns.reduce((acc, { device_name, pattern_type, message }) => {
    acc[device_name] = acc[device_name] || { device_name, last_seen: [], cooccur: [], routine: [] };
    acc[device_name][pattern_type].push(message);
    return acc;
  }, {});
  const allDevices = Object.values(grouped);

  // pick top 3 real + 17 fake, drop any “Unknown”
  const real = allDevices
    .filter(d => d.device_name.startsWith('[Real]') && !d.device_name.includes('(Unknown)'))
    .slice(0, 3);
  const fake = allDevices
    .filter(d => !d.device_name.startsWith('[Real]') && !d.device_name.includes('(Unknown)'))
    .slice(0, 17);
  const visible = [...real, ...fake];

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