// components/DashboardThree.js
import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function DashboardThree() {
  const [lastSeen, setLastSeen]   = useState([]);
  const [cooccur, setCooccur]     = useState([]);
  const [routine, setRoutine]     = useState([]);

  useEffect(() => {
    let mounted = true;
    async function fetchPatterns() {
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
    fetchPatterns();
    const iv = setInterval(fetchPatterns, 10000);
    return () => { mounted = false; clearInterval(iv) };
  }, []);

  return (
    <div className="space-y-8">
      <header className="text-center py-4">
        <h2 className="text-3xl font-semibold">Ο Μεγάλος Αδελφός</h2>
        <p className="text-sm text-red-600">(High Surveillance Mode – simulated)</p>
      </header>

      {/* Last Seen */}
      <Card>
        <CardHeader><CardTitle>Ιστορικό Τελευταίας Εμφάνισης</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {lastSeen.map((r,i) =>
            <div key={i}>
              <strong>{r.device_name}</strong> — {r.message}
            </div>
          )}
          {lastSeen.length===0 && <p className="text-gray-500">— κανένα δεδομένο —</p>}
        </CardContent>
      </Card>

      {/* Co‑Occurrence */}
      <Card>
        <CardHeader><CardTitle>Συν-Εμφανίσεις</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {cooccur.map((r,i) =>
            <div key={i}>
              <strong>{r.device_name}</strong> — {r.message}
            </div>
          )}
          {cooccur.length===0 && <p className="text-gray-500">— κανένα δεδομένο —</p>}
        </CardContent>
      </Card>

      {/* Routine */}
      <Card>
        <CardHeader><CardTitle>Υποτιθέμενα Πρότυπα</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {routine.map((r,i) =>
            <div key={i}>
              <strong>{r.device_name}</strong> — {r.message}
            </div>
          )}
          {routine.length===0 && <p className="text-gray-500">— κανένα δεδομένο —</p>}
        </CardContent>
      </Card>
    </div>
  );
}
