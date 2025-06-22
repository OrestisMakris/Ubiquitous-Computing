import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Wifi } from 'lucide-react';

import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer as BarResp
} from 'recharts';
 
const RSSI_CENTER_PLOT = -30; 
const RSSI_EDGE_PLOT   = -90; 
const BUBBLE_DIAMETER = 16; 
const CENTER_DOT_DIAMETER = 8; 

// Helper function to identify likely phone devices
const PHONE_KEYWORDS = [
  'iphone', 'galaxy', 'pixel', 'xperia', 'oneplus', 'moto', 
  'redmi', 'poco', 'oppo', 'vivo', 'realme', 'nokia', 'android', 'ios',
  'phone', 'mobile', 'smartphone' 
];

function isLikelyPhone(deviceName) {
  if (!deviceName || typeof deviceName !== 'string') {
    return false;
  }
  const lowerDeviceName = deviceName.toLowerCase();
  return PHONE_KEYWORDS.some(keyword => lowerDeviceName.includes(keyword));
}

export default function DashboardTwo() {
  const [devices, setDevices] = useState([])
  const [hist, setHist]       = useState([])
  const [sessionOverviewData, setSessionOverviewData] = useState({ totalUnique: 0, longestPresent: 0 });
  const [newlyWelcomedPhones, setNewlyWelcomedPhones] = useState([]); // State for new phones

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [visRes, evRes] = await Promise.all([
          fetch('/api/visible-devices').then(r => r.ok ? r.json() : Promise.reject(r.status)),
          fetch('/api/device-events').then(r => r.ok ? r.json() : Promise.reject(r.status))
        ]);
        const visDevices = Array.isArray(visRes.devices) ? visRes.devices : [];
        setDevices(visDevices);

        // Filter for new phone devices to welcome
        const newPhonesDetected = visDevices.filter(
          d => d.isNew && isLikelyPhone(d.name)
        );
        setNewlyWelcomedPhones(newPhonesDetected);

        const totalUnique = visDevices.length;
        const longestPresentSec = visDevices.length > 0 ? Math.max(0, ...visDevices.map(d => d.duration)) : 0;
        const longestPresentMin = Math.floor(longestPresentSec / 60);
        setSessionOverviewData({ totalUnique, longestPresent: longestPresentMin });

        const now = Date.now();
        const BIN_COUNT = 6;
        const BIN_SIZE_MIN = 15 / BIN_COUNT; 
        const labels = ['-15′','-12′','-10′','-7′','-5′','-2′'];
        const bins = labels.map(t => ({ time: t, count: 0 }));
        if (evRes.events && Array.isArray(evRes.events)) {
          evRes.events.forEach(e => {
            const diffMin = (now - new Date(e.timestamp)) / 60000;
            if (diffMin < 15) {
              const idx = Math.min(
                BIN_COUNT - 1,
                Math.floor(diffMin / BIN_SIZE_MIN)
              );
              bins[BIN_COUNT - 1 - idx].count++;
            }
          });
        }
        setHist(bins);
      } catch (err) {
        console.error('DashboardTwo fetch error:', err);
        setDevices([]);
        setNewlyWelcomedPhones([]); // Clear on error
        setSessionOverviewData({ totalUnique: 0, longestPresent: 0 }); 
        const labels = ['-15′','-12′','-10′','-7′','-5′','-2′']; 
        setHist(labels.map(t => ({ time: t, count: 0 })));
      }
    };

    fetchAll();
    const interval = setInterval(fetchAll, 5000);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="space-y-10">
      <header className="text-center py-6">
        <p className="text-4xl text-[#0017a5] font-bold">
          🕵️‍♂️ Παρατηρητής Μοτίβων Dashboard  2 
        </p>
        <p className="mt-2 text-sm text-gray-600">
          Παρατηρεί προσωρινά δημόσια ονόματα συσκευών χωρίς μακροχρόνιο ιστορικό
        </p>
      </header>

      {/* Welcome Section for New Phones - Updated Styling */}
      {newlyWelcomedPhones.length > 0 && (
        <div className="my-4 p-4 bg-blue-50 border border-blue-200 rounded-lg shadow-sm text-center">
          {newlyWelcomedPhones.map(phone => (
            <p key={phone.pseudonym} className="text-lg text-blue-700"> {/* Adjusted base styling */}
              <strong className="font-bold">👋 Καλωσήρθες</strong>{' '} {/* Bold "Καλωσήρθες" */}
              <span
                style={{
                  fontSize: '2rem',
                  lineHeight: '2rem',
                  fontWeight: '800',
                  color: 'rgb(0, 9, 76)', // Applied custom style
                }}
              >
                {phone.name}
              </span>
              !
            </p>
          ))}
        </div>
      )}

        {/* Main card grid: 2 columns on medium screens */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        {/* ... (rest of the cards: Devices Currently Visible, Proximity, Session Overview, Timeline) ... */}
        {/* Card 1: Devices Currently Visible (Row 1, Col 1) */}
        <Card>
          <CardHeader>
            <CardTitle>📱 Συσκευές σε Προβολή Τώρα</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-gray-200">
              {devices.map(d => {
                const totalMinutes = Math.floor(d.duration / 60);
                let label;
                if (totalMinutes > 0) {
                  label = `${totalMinutes} min`;
                } else if (d.duration > 0) {
                  label = "<1 min";
                } else {
                  label = "0 min";
                }

                return (
                  <li
                    key={d.pseudonym}
                    className="py-4 flex justify-between items-center"
                  >
                    <div className="flex items-center space-x-3">
                      {d.isNew && (
                        <span
                          style={{
                            paddingLeft: '0.75rem',
                            paddingRight: '2 rem',
                            paddingTop: '0.25rem',
                            paddingBottom: '0.25rem',
                            backgroundColor: '#fee2e2',
                            color: '#b30505',
                            borderRadius: '0.5rem',
                            fontSize: '1.8rem',
                            lineHeight: '1.5rem',
                            fontWeight: '800',
                            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                          }}
                        >
                          Νέα!
                        </span>
                      )}
                      <span
                        style={{
                          fontSize: '2.4rem',
                          lineHeight: '2rem',
                          fontWeight: '600',
                          color: 'rgb(0, 19, 159)',
                        }}
                      >
                        {d.name}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: '2.2rem',
                        lineHeight: '2rem',
                        color: 'rgb(64, 0, 107)',
                        fontWeight: '600',
                      }}
                    >
                      {label}
                    </span>
                  </li>
                );
              })}
              {devices.length === 0 && (
                <li className="py-4 text-gray-500 italic">Κανένα σήμα προς το παρόν</li>
              )}
            </ul>
          </CardContent>
        </Card>

        {/* Card 2: Proximity Clusters (Row 1, Col 2) */}
        <Card>
          <CardHeader>
            <CardTitle>📶 Proximity Closer to center = stronger signal</CardTitle> 
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="flex items-center justify-center w-full py-6">
              <svg
                width={400}
                height={400}
                viewBox="0 0 256 256" 
                className="mx-auto"
              >
                <circle cx="128" cy="128" r="120" fill="#C7D2FE" />
                <circle
                  cx="128"
                  cy="128"
                  r={CENTER_DOT_DIAMETER / 2} 
                  fill="red"
                />
                {devices
                  .filter(d => typeof d.rssi === "number")
                  .map((d, i, arr) => {
                    const range = RSSI_CENTER_PLOT - RSSI_EDGE_PLOT;
                    const clamped = Math.max(RSSI_EDGE_PLOT, Math.min(RSSI_CENTER_PLOT, d.rssi));
                    const norm = (clamped - RSSI_EDGE_PLOT) / range;
                    const maxR = 120 - (BUBBLE_DIAMETER / 2); 
                    const dist = (1 - norm) * maxR;
                    const angle = ((360 / arr.length) * i + 45) * (Math.PI / 180);
                    const x = 128 + dist * Math.cos(angle);
                    const y = 128 + dist * Math.sin(angle);

                    return (
                      <circle
                        key={d.pseudonym}
                        cx={x}
                        cy={y}
                        r={BUBBLE_DIAMETER / 2} 
                        fill="rgb(0, 9, 78)"
                        stroke="#fff"
                        strokeWidth="1"
                      />
                    );
                  })}
              </svg>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <Wifi className="h-5 w-5 text-gray-500 mr-3" />
            <CardTitle className="text-xl font-bold">Session Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="flex items-center">
              <p className="text-lg text-gray-700 font-semibold">Total Unique Devices:</p>
              <p className="text-3xl font-bold text-amber-600 ml-auto">{sessionOverviewData.totalUnique}</p>
            </div>
            <div className="flex items-center">
              <p className="text-lg text-gray-700 font-semibold">Longest Present:</p>
              <p className="text-3xl font-bold text-amber-600 ml-auto">
                {sessionOverviewData.longestPresent} min
              </p>
            </div>
          </CardContent>
        </Card>
        
        {/* Card 4: Recent Detection Timeline (Spans 2 columns on the next row) */}
        <Card className="md:col-span-2">
            <CardHeader>
            <CardTitle>⏱️ Οπτικοποίηση Πρόσφατης Δραστηριότητας</CardTitle>
            </CardHeader>
            <CardContent>
            <p className="mb-4 text-[0.1rem] text-gray-500">
                Μια χρονογραμμή με ανώνυμα “blips” που δείχνουν γεγονότα ανίχνευσης
                συσκευών τα τελευταία ~15′. Κάθε bar απεικονίζει ένταση ανιχνεύσεων,
                όχι “νέα” συσκευή.
            </p>
            <BarResp width="100%" height={250}>
                <BarChart data={hist}>
                <XAxis dataKey="time" tick={{ fontSize: 18 ,fontWeight: 600 }} />
                <YAxis hide domain={[0, 'dataMax']} />
                <Tooltip />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {hist.map((entry, i) => {
                    const alphaDenominator = hist.length > 1 ? hist.length - 1 : 1;
                    const alpha = 0.3 + (i / alphaDenominator) * 0.7;
                    const fill = `rgba(0,23,73,${alpha.toFixed(2)})`;
                    return <Cell key={`cell-${i}`} fill={fill} />;
                    })}
                </Bar>
                </BarChart>
            </BarResp>
            </CardContent>
        </Card>
      </div>

      <Card className="mx-auto max-w-lg">
        <CardContent className="pt-6">
            <p className="text-center text-2xl md:text-3xl font-extrabold text-gray-800">
            🔒 Δεν διατηρούμε μακροχρόνιο ιστορικό. Όλα τα ονόματα εμφανίζονται για λίγα δευτερόλεπτα μόνο.
          </p>
        </CardContent>
      </Card>
      <footer className="text-center text-base text-gray-800 font-extrabold mt-10">
        © 2025 | CEID_NE576 — Ubiquitous Computing Lab Exercise  2024/25<br/>
        👤 Orestis Antonis Makris (AM 1084516) Prof. Andreas Komninos
      </footer>
    </div>
  );
}