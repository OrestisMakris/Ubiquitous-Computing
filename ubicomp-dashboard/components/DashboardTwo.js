import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Wifi, MapPin, Clock, BarChart2, AlertTriangle } from 'lucide-react';

const formatDuration = (seconds) => {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (remainingSeconds === 0) return `${minutes} min`;
  return `${minutes}m ${remainingSeconds}s`;
};

const ProximityClusters = ({ groups }) => {
  const { near = [], mid = [], far = [] } = groups;

  // Combine all devices with their group for positioning
  const allDevicesInCluster = [
    ...near.map(name => ({ name, group: 'near' })),
    ...mid.map(name => ({ name, group: 'mid' })),
    ...far.map(name => ({ name, group: 'far' })),
  ].slice(0, 10); // Limit displayed devices for clarity

  const getPosition = (index, totalInGroup, groupName) => {
    const angleStep = (Math.PI * 2) / Math.max(1, totalInGroup);
    const angle = index * angleStep + (groupName === 'mid' ? angleStep / 2 : 0); // Offset mid for better distribution

    let radiusPercentage;
    if (groupName === 'near') radiusPercentage = 20 + Math.random() * 10; // 20-30%
    else if (groupName === 'mid') radiusPercentage = 40 + Math.random() * 10; // 40-50%
    else radiusPercentage = 60 + Math.random() * 10; // 60-70%

    // Ensure dots are well within the circle
    radiusPercentage = Math.min(radiusPercentage, 40); // Max 40% from center to keep inside a 80% diameter view

    const x = 50 + radiusPercentage * Math.cos(angle);
    const y = 50 + radiusPercentage * Math.sin(angle);
    return { x: `${x}%`, y: `${y}%` };
  };

  return (
    <div className="relative w-full h-72 flex items-center justify-center">
      <div className="absolute w-[90%] h-[90%] bg-emerald-50 rounded-full shadow-inner"></div>
      <div className="absolute text-xs text-emerald-700 font-medium">Scanner</div>
      {allDevicesInCluster.map((device, i) => {
        // Distribute devices more evenly if they were all in one group
        const totalForPos = allDevicesInCluster.length;
        const effectiveIndex = i;
        let effectiveGroup = device.group;

        // If too many devices, simplify grouping for visual effect
        if (totalForPos > 5) {
            if (i < Math.floor(totalForPos * 0.3)) effectiveGroup = 'near';
            else if (i < Math.floor(totalForPos * 0.7)) effectiveGroup = 'mid';
            else effectiveGroup = 'far';
        }

        const { x, y } = getPosition(effectiveIndex, totalForPos, effectiveGroup);
        return (
          <div
            key={`${device.group}-${device.name}-${i}`}
            title={device.name}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
            style={{ left: x, top: y }}
          >
            <div className="w-4 h-4 bg-emerald-500 rounded-full shadow-md"></div>
            <span className="mt-1 text-[10px] text-emerald-700 bg-white/70 px-1 rounded backdrop-blur-sm whitespace-nowrap">
              {device.name.substring(0, 12) + (device.name.length > 12 ? '...' : '')}
            </span>
          </div>
        );
      })}
      <p className="absolute bottom-3 text-xs text-gray-500">Closer to center = Closer to scanner</p>
    </div>
  );
};

const ActivityTimelineChart = ({ events }) => {
  const now = Date.now();
  const fifteenMinutesAgo = now - 15 * 60 * 1000;
  const binCount = 5;
  const binSize = (15 * 60 * 1000) / binCount;
  const bins = Array(binCount).fill(null).map((_, i) => ({
    label: i === binCount - 1 ? "Now" : `-${15 - (i * 3) - 3}m`, // Adjusted label for clarity
    count: 0,
    startTime: fifteenMinutesAgo + i * binSize,
    endTime: fifteenMinutesAgo + (i + 1) * binSize,
  }));
  bins[0].label = "-15m"; // Ensure first label is -15m


  events.forEach(event => {
    for (const bin of bins) {
      if (event.timestamp >= bin.startTime && event.timestamp < bin.endTime) {
        bin.count++;
        break;
      }
    }
  });

  const maxCount = Math.max(1, ...bins.map(b => b.count));

  return (
    <div className="h-48 flex items-end justify-around p-4 bg-slate-100 rounded-lg">
      {bins.map((bin, i) => (
        <div key={i} className="flex flex-col items-center h-full justify-end w-[18%]">
          <div
            title={`${bin.count} detections`}
            className="w-full bg-indigo-500 hover:bg-indigo-600 rounded-t-md transition-all duration-300"
            style={{ height: `${(bin.count / maxCount) * 90}%` }}
          ></div>
          <span className="text-xs text-gray-500 mt-2">{bin.label}</span>
        </div>
      ))}
    </div>
  );
};

export default function DashboardTwo() {
  const [currentDevices, setCurrentDevices] = useState([]);
  const [proximityGroups, setProximityGroups] = useState({ near: [], mid: [], far: [] });
  const [deviceEvents, setDeviceEvents] = useState([]);
  const seenDevicesRef = useRef(new Set());
  const [welcomeMessages, setWelcomeMessages] = useState([]);

  useEffect(() => {
    let mounted = true;
    async function fetchAllData() {
      try {
        // Simulate API delay for loading states if needed
        // await new Promise(resolve => setTimeout(resolve, 1000));

        const [currentRes, groupsRes, eventsRes] = await Promise.all([
          fetch('/api/current-devices').then(r => r.ok ? r.json() : { devices: [] }),
          fetch('/api/rssi-current-groups').then(r => r.ok ? r.json() : { near: [], mid: [], far: [] }),
          fetch('/api/device-events').then(r => r.ok ? r.json() : []),
        ]);

        if (!mounted) return;

        const newWelcomes = [];
        const updatedCurrentDevices = currentRes.devices.map(d => {
          let isNew = false;
          if (!seenDevicesRef.current.has(d.pseudonym)) {
            seenDevicesRef.current.add(d.pseudonym);
            isNew = true;
            const welcomeMsg = `Καλωσήρθες ${d.name}!`;
            newWelcomes.push({ id: d.pseudonym + Date.now(), text: welcomeMsg });
          }
          return { ...d, isNew };
        });

        if (newWelcomes.length > 0) {
          setWelcomeMessages(prev => [...newWelcomes, ...prev].slice(0, 3)); // Show latest 3, new ones on top
          newWelcomes.forEach(msg => {
            setTimeout(() => {
              if (mounted) {
                setWelcomeMessages(prev => prev.filter(m => m.id !== msg.id));
              }
            }, 7000);
          });
        }

        setCurrentDevices(updatedCurrentDevices);
        setProximityGroups(groupsRes);
        setDeviceEvents(eventsRes);

      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      }
    }

    fetchAllData();
    const intervalId = setInterval(fetchAllData, 5000);
    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, []);

  const totalUniqueDevicesInSession = seenDevicesRef.current.size;
  const longestPresentDuration = currentDevices.length > 0
    ? Math.max(0, ...currentDevices.map(d => d.duration))
    : 0;

  return (
    <div className="p-4 md:p-6 space-y-6 bg-slate-50 min-h-screen font-sans">
      {welcomeMessages.length > 0 && (
        <div className="fixed top-20 right-4 space-y-2 z-50 w-64">
          {welcomeMessages.map(msg => (
            <div key={msg.id} className="p-3 bg-blue-600 text-white rounded-lg shadow-xl text-sm animate-fadeInRight">
              {msg.text}
            </div>
          ))}
        </div>
      )}
      
      <header className="text-center pb-4 border-b border-gray-200">
        <h1 className="text-3xl font-semibold text-gray-700">Ο Παρατηρητής Μοτίβων</h1>
        <p className="text-sm text-gray-500">(Session-based, short‑term visibility)</p>
        <p className="text-xs text-gray-400 mt-1">Temporary Visibility Zone</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-lg bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium text-gray-700">Συσκευές Παρούσες Τώρα</CardTitle>
            <Wifi className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent className="space-y-2 max-h-96 overflow-y-auto py-3 px-4">
            {currentDevices.length > 0 ? currentDevices.map(d => (
              <div key={d.pseudonym} className="flex justify-between items-center p-3 bg-slate-50 hover:bg-slate-100 rounded-lg shadow-sm transition-all">
                <span className={`font-medium text-sm ${d.isNew ? 'text-green-600' : 'text-gray-700'}`}>
                  {d.name}
                  {d.isNew && <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">Νέα!</span>}
                </span>
                <span className="text-xs text-gray-500">{formatDuration(d.duration)}</span>
              </div>
            )) : <p className="text-gray-500 py-10 text-center">Καμία συσκευή ορατή αυτή τη στιγμή.</p>}
          </CardContent>
        </Card>

        <Card className="shadow-lg bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium text-gray-700">Ομαδοποίηση κατά Εγγύτητα</CardTitle>
            <MapPin className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <ProximityClusters groups={proximityGroups} />
          </CardContent>
        </Card>

        <Card className="shadow-lg bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium text-gray-700">Χρονογράφημα Δραστηριότητας</CardTitle>
            <Clock className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            {deviceEvents.length > 0 ? <ActivityTimelineChart events={deviceEvents} /> : <p className="text-gray-500 py-10 text-center h-48 flex items-center justify-center">Δεν υπάρχουν πρόσφατα γεγονότα ανίχνευσης.</p>}
          </CardContent>
        </Card>

        <Card className="shadow-lg bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium text-gray-700">Επισκόπηση Συνεδρίας</CardTitle>
            <BarChart2 className="h-5 w-5 text-amber-500" />
          </CardHeader>
          <CardContent className="space-y-3 pt-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">Συνολικές Μοναδικές Συσκευές:</p>
              <p className="text-xl font-semibold text-gray-800">{totalUniqueDevicesInSession}</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">Μεγαλύτερη Διάρκεια Παρουσίας:</p>
              <p className="text-xl font-semibold text-gray-800">{formatDuration(longestPresentDuration)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <footer className="text-center pt-6 mt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 flex items-center justify-center">
          <AlertTriangle className="h-4 w-4 mr-2 text-orange-500" />
          Σημείωση: Τα ονόματα των συσκευών είναι προσωρινά ορατά. Αυτή η συνεδρία θα γίνει επαναφορά σύντομα.
        </p>
      </footer>
      <style jsx global>{`
        @keyframes fadeInRight {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-fadeInRight { animation: fadeInRight 0.3s ease-out forwards; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"; }
      `}</style>
    </div>
  );
}