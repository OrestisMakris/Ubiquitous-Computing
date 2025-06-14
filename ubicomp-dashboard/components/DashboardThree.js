// components/DashboardThree.js
import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function DashboardThree() {
  const [lastSeen, setLastSeen]   = useState([]);
  const [cooccur, setCooccur]     = useState([]);
  const [routine, setRoutine]     = useState([]);

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

  const renderList = data => data.map((r,i) => (
    <div key={i} className="py-1">
      <strong>{r.device_name}</strong> — {r.message}
    </div>
  )) || <p className="text-gray-500">— κανένα δεδομένο —</p>;

  return (
    <div className="space-y-8">
      <header className="text-center py-4">
        <h2 className="text-3xl font-bold">Ο Μεγάλος Αδελφός</h2>
        <p className="text-sm text-red-600">(High Surveillance Mode – simulated)</p>
      </header>

      <Card>
        <CardHeader><CardTitle>Ιστορικό Τελευταίας Εμφάνισης</CardTitle></CardHeader>
        <CardContent>{renderList(lastSeen)}</CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Συν-Εμφανίσεις</CardTitle></CardHeader>
        <CardContent>{renderList(cooccur)}</CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Υποτιθέμενα Πρότυπα</CardTitle></CardHeader>
        <CardContent>{renderList(routine)}</CardContent>
      </Card>
    </div>
  );
}
