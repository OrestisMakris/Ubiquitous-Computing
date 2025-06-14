import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Wifi, MapPin } from 'lucide-react';

export default function DashboardTwo() {
  const [devices, setDevices] = useState([]);
  const [events, setEvents]   = useState([]);

  useEffect(() => {
    const fetchAll = async () => {
      const [vis, ev] = await Promise.all([
        fetch('/api/visible-devices').then(r => r.json()),
        fetch('/api/device-events').then(r => r.json())
      ]);
      setDevices(vis.devices);
      setEvents(ev.events);
    };
    fetchAll();
    const iv = setInterval(fetchAll, 5000);
    return () => clearInterval(iv);
  }, []);

  // group into three proximity buckets
  const groups = devices.reduce((acc, d) => {
    acc[d.group].push(d);
    return acc;
  }, { near: [], mid: [], far: [] });

  return (
    <div className="space-y-10">
      <header className="text-center py-6">
        <p className="text-4xl text-[#0017a5] font-bold">
          🕵️‍♂️ Ταμπλό Επιπέδου 2: Ο Παρατηρητής Μοτίβων
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
            <ul className="space-y-2">
              {devices.map(d => (
                <li key={d.pseudonym} className="flex justify-between">
                  <span>
                    {d.name}{' '}
                    {d.isNew && (
                      <span className="ml-2 px-1 bg-blue-100 text-blue-800 rounded text-xs">
                        Νέα!
                      </span>
                    )}
                  </span>
                  <span className="text-gray-500">
                    {Math.floor(d.duration / 60)}′
                  </span>
                </li>
              ))}
              {devices.length === 0 && <li>Κανένα σήμα προς το παρόν</li>}
            </ul>
          </CardContent>
        </Card>

        {/* 2. Proximity Clusters */}
        <Card>
          <CardHeader>
            <CardTitle>📶 Ομαδοποίηση Κατ’ Εγγύτητα</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-around">
              {['near','mid','far'].map(key => (
                <div key={key} className="text-center">
                  <p className="font-medium">
                    {key==='near' ? 'Κοντά' : key==='mid' ? 'Μέτρια' : 'Μακριά'}
                  </p>
                  <ul className="mt-2 space-y-1">
                    {groups[key].map(d => (
                      <li
                        key={d.pseudonym}
                        className="flex items-center space-x-1"
                      >
                        {key==='near' && <Wifi size={12} />}
                        {key==='mid' && <MapPin size={12} />}
                        {key==='far' && <MapPin size={12} className="opacity-50" />}
                        <span>{d.name}</span>
                      </li>
                    ))}
                    {groups[key].length===0 && <li className="text-gray-400">—</li>}
                  </ul>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 3. Recent Detection Timeline */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>⏱️ Χρονογράφημα Σημάτων (τελευταία ~15′)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-1 overflow-x-auto py-4">
              {events.map((e,i) => (
                <div
                  key={i}
                  title={new Date(e.timestamp).toLocaleTimeString()}
                  className="h-3 w-3 bg-[#0017a5] rounded-full animate-pulse"
                />
              ))}
              {events.length===0 && (
                <p className="text-gray-500">Κανένα πρόσφατο σήμα</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mx-auto max-w-lg">
        <CardContent>
          <p className="text-center text-sm text-gray-600">
            🔒 Δεν διατηρούμε μακροχρόνιο ιστορικό. Όλα τα ονόματα εμφανίζονται για λίγα δευτερόλεπτα μόνο.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}