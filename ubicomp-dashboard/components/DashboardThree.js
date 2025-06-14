import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function DashboardThree() {
  const [lastSeen, setLastSeen] = useState([]);
  const [cooccur,  setCooccur]  = useState([]);
  const [routine,  setRoutine]  = useState([]);

  useEffect(() => {
    let m = true;
    async function fetchAll() {
      const [ls, co, rt] = await Promise.all([
        fetch('/api/pattern-last-seen').then(r => r.json()),
        fetch('/api/pattern-cooccur').then(r => r.json()),
        fetch('/api/pattern-routine').then(r => r.json()),
      ]);
      if (!m) return;
      setLastSeen(ls);
      setCooccur(co);
      setRoutine(rt);
    }
    fetchAll();
    const iv = setInterval(fetchAll, 10000);
    return () => { m = false; clearInterval(iv); };
  }, []);

  // group cooccur + routine
  const grouped = [...cooccur.map(p => ({...p, type:'cooccur'})),
                   ...routine.map(p => ({...p, type:'routine'}))]
    .reduce((acc, { device_name, type, message }) => {
      if (!acc[device_name]) {
        acc[device_name] = { device_name, last_seen:[], cooccur:[], routine:[] };
      }
      acc[device_name][type].push(message);
      return acc;
    }, {});

  // inject lastSeen
  lastSeen.forEach(r => {
    const grp = grouped[r.device_name] ||= { device_name:r.device_name, last_seen:[], cooccur:[], routine:[] };
    // only one message per real device
    grp.last_seen = [r.message];
  });

  const all = Object.values(grouped);
  const realNames = new Set(lastSeen.map(r => r.device_name));
  const real = all.filter(d => realNames.has(d.device_name));
  const fake = all.filter(d => !realNames.has(d.device_name)).slice(0, 20 - real.length);
  const visible = [...real, ...fake];

  return (
    <div>
      <header className="text-center py-4">
        <h2 className="text-3xl font-bold">Active Surveillance Profiles</h2>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visible.map((dev,i) => {
          // dedupe each array
          const seen    = [...new Set(dev.last_seen)];
          const social  = [...new Set(dev.cooccur)];
          const routine = [...new Set(dev.routine)];

          return (
            <Card key={i}>
              <CardHeader>
                <CardTitle><strong className="text-blue-600">{dev.device_name}</strong></CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <h4 className="font-semibold">Movement Patterns</h4>
                  {seen.length
                    ? seen.map((m,j) => (
                        <div key={j} className="flex items-center py-1">
                          <span>📍</span>
                          <span className="ml-2">{m}</span>
                        </div>
                      ))
                    : <p className="text-gray-500">— none —</p>
                  }
                </div>
                <div className="mt-4">
                  <h4 className="font-semibold">Social Insights</h4>
                  {social.map((m,j) => (
                    <div key={j} className="flex items-center py-1">
                      <span>👥</span>
                      <span className="ml-2">{m}</span>
                    </div>
                  ))}
                  {routine.map((m,j) => (
                    <div key={j} className="flex items-center py-1">
                      <span>⏱️</span>
                      <span className="ml-2">{m}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>  );
}