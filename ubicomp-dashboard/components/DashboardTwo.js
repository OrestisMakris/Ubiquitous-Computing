import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Wifi, MapPin, Clock, BarChart2, AlertTriangle } from 'lucide-react'; // Using lucide-react for icons

// Helper to format seconds to mm:ss or a simple minute string
const formatDuration = (seconds) => {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (remainingSeconds === 0) return `${minutes} min`;
  return `${minutes}m ${remainingSeconds}s`;
};

// --- Sub-components for visual elements ---

// Proximity Clusters Visualizer
const ProximityClusters = ({ groups }) => {
  const { near = [], mid = [], far = [] } = groups;
  const allDevices = [
    ...near.map(name => ({ name, group: 'near' })),
    ...mid.map(name => ({ name, group: 'mid' })),
    ...far.map(name => ({ name, group: 'far' })),
  ];

  // Simple scattering logic
  const getPosition = (index, totalInGroup, groupName) => {
    const angle = (index / Math.max(1, totalInGroup)) * Math.PI * 2 * (Math.random() * 0.4 + 0.8); // Add some randomness
    let radiusPercentage;
    if (groupName === 'near') radiusPercentage = 25 * (Math.random() * 0.3 + 0.7);
    else if (groupName === 'mid') radiusPercentage = 50 * (Math.random() * 0.3 + 0.7);
    else radiusPercentage = 75 * (Math.random() * 0.3 + 0.7);

    const x = 50 + radiusPercentage * Math.cos(angle);
    const y = 50 + radiusPercentage * Math.sin(angle);
    return { x: `${x}%`, y: `${y}%` };
  };

  return (
    <div className="relative w-full h-64 bg-green-50 rounded-lg flex items-center justify-center overflow-hidden">
      <div className="absolute text-xs text-green-700 font-semibold">Scanner</div>
      {/* Concentric circles for zones */}
      <div className="absolute w-[90%] h-[90%] border-2 border-green-200 rounded-full"></div>
      <div className="absolute w-[60%] h-[60%] border-2 border-green-300 rounded-full"></div>
      <div className="absolute w-[30%] h-[30%] border-2 border-green-400 rounded-full"></div>

      {near.map((name, i) => {
        const { x, y } = getPosition(i, near.length, 'near');
        return <div key={`near-${name}-${i}`} title={name} className="absolute w-3 h-3 bg-green-500 rounded-full transform -translate-x-1/2 -translate-y-1/2" style={{ left: x, top: y }}><span className="text-xs absolute -top-4 left-1/2 transform -translate-x-1/2 whitespace-nowrap">{name.substring(0,10)}</span></div>;
      })}
      {mid.map((name, i) => {
        const { x, y } = getPosition(i, mid.length, 'mid');
        return <div key={`mid-${name}-${i}`} title={name} className="absolute w-3 h-3 bg-yellow-500 rounded-full transform -translate-x-1/2 -translate-y-1/2" style={{ left: x, top: y }}><span className="text-xs absolute -top-4 left-1/2 transform -translate-x-1/2 whitespace-nowrap">{name.substring(0,10)}</span></div>;
      })}
      {far.map((name, i) => {
        const { x, y } = getPosition(i, far.length, 'far');
        return <div key={`far-${name}-${i}`} title={name} className="absolute w-3 h-3 bg-red-500 rounded-full transform -translate-x-1/2 -translate-y-1/2" style={{ left: x, top: y }}><span className="text-xs absolute -top-4 left-1/2 transform -translate-x-1/2 whitespace-nowrap">{name.substring(0,10)}</span></div>;
      })}
       <p className="absolute bottom-2 text-xs text-gray-500">Closer to center = Closer to scanner</p>
    </div>
  );
};

// Recent Detection Timeline Chart
const ActivityTimelineChart = ({ events }) => {
  const now = Date.now();
  const fifteenMinutesAgo = now - 15 * 60 * 1000;
  const binCount = 5; // 5 bins of 3 minutes each
  const binSize = (15 * 60 * 1000) / binCount;
  const bins = Array(binCount).fill(null).map((_, i) => ({
    label: `-${15 - i * 3}m`,
    count: 0,
    startTime: fifteenMinutesAgo + i * binSize,
    endTime: fifteenMinutesAgo + (i + 1) * binSize,
  }));

  events.forEach(event => {
    for (const bin of bins) {
      if (event.timestamp >= bin.startTime && event.timestamp < bin.endTime) {
        bin.count++;
        break;
      }
    }
  });

  const maxCount = Math.max(1, ...bins.map(b => b.count)); // Avoid division by zero, ensure at least 1 for scaling

  return (
    <div className="h-48 flex items-end justify-around p-4 bg-gray-50 rounded-lg">
      {bins.map((bin, i) => (
        <div key={i} className="flex flex-col items-center h-full justify-end w-1/6">
          <div
            title={`${bin.count} detections`}
            className="w-full bg-purple-400 hover:bg-purple-500 rounded-t-sm transition-all duration-300"
            style={{ height: `${(bin.count / maxCount) * 90}%` }} // 90% of container height for max bar
          ></div>
          <span className="text-xs text-gray-500 mt-1">{bin.label === "-0m" ? "Now" : bin.label}</span>
        </div>
      ))}
    </div>
  );
};


export default function DashboardTwo() {
  const [currentDevices, setCurrentDevices] = useState([]); // { pseudonym, name, rssi, majorClass, duration, isNew }
  const [proximityGroups, setProximityGroups] = useState({ near: [], mid: [], far: [] });
  const [deviceEvents, setDeviceEvents] = useState([]); // { pseudonym, timestamp }
  const seenDevicesRef = useRef(new Set());
  const [welcomeMessages, setWelcomeMessages] = useState([]); // { id: string, text: string }

  useEffect(() => {
    let mounted = true;

    async function fetchAllData() {
      try {
        const [currentRes, groupsRes, eventsRes] = await Promise.all([
          fetch('/api/current-devices').then(r => r.json()),
          fetch('/api/rssi-current-groups').then(r => r.json()),
          fetch('/api/device-events').then(r => r.json()),
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
          setWelcomeMessages(prev => [...prev, ...newWelcomes].slice(-5)); // Keep last 5 messages
          newWelcomes.forEach(msg => {
            setTimeout(() => {
              if (mounted) {
                setWelcomeMessages(prev => prev.filter(m => m.id !== msg.id));
              }
            }, 7000); // Message disappears after 7 seconds
          });
        }

        setCurrentDevices(updatedCurrentDevices);
        setProximityGroups(groupsRes);
        setDeviceEvents(eventsRes);

      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        // Optionally set an error state here to display to the user
      }
    }

    fetchAllData();
    const intervalId = setInterval(fetchAllData, 5000); // Refresh every 5 seconds

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
    <div className="p-4 md:p-6 space-y-6 bg-gray-100 min-h-screen">
      {/* Welcome Messages Area */}
      {welcomeMessages.length > 0 && (
        <div className="fixed top-20 right-4 space-y-2 z-50 w-64">
          {welcomeMessages.map(msg => (
            <div key={msg.id} className="p-3 bg-blue-500 text-white rounded-lg shadow-xl text-sm animate-fadeInRight">
              {msg.text}
            </div>
          ))}
        </div>
      )}
      
      <header className="text-center pb-4 border-b border-gray-300">
        <h1 className="text-3xl font-semibold text-gray-800">Ο Παρατηρητής Μοτίβων</h1>
        <p className="text-sm text-gray-500">(Session-based, short‑term visibility)</p>
        <p className="text-xs text-gray-400 mt-1">Temporary Visibility Zone</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Devices Currently Visible */}
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">Συσκευές Παρούσες Τώρα</CardTitle>
            <Wifi className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent className="space-y-3 max-h-96 overflow-y-auto">
            {currentDevices.length > 0 ? currentDevices.map(d => (
              <div key={d.pseudonym} className="flex justify-between items-center p-2 bg-white rounded-md shadow-sm hover:shadow-md transition-shadow">
                <span className={`font-medium ${d.isNew ? 'text-green-600' : 'text-gray-700'}`}>
                  {d.name}
                  {d.isNew && <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">Νέα!</span>}
                </span>
                <span className="text-sm text-gray-500">{formatDuration(d.duration)}</span>
              </div>
            )) : <p className="text-gray-500 py-4 text-center">Καμία συσκευή ορατή αυτή τη στιγμή.</p>}
          </CardContent>
        </Card>

        {/* 2. Proximity Clusters */}
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">Ομαδοποίηση κατά Εγγύτητα</CardTitle>
            <MapPin className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <ProximityClusters groups={proximityGroups} />
          </CardContent>
        </Card>

        {/* 3. Recent Detection Timeline */}
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">Χρονογράφημα Δραστηριότητας</CardTitle>
            <Clock className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            {deviceEvents.length > 0 ? <ActivityTimelineChart events={deviceEvents} /> : <p className="text-gray-500 py-4 text-center h-48 flex items-center justify-center">Δεν υπάρχουν πρόσφατα γεγονότα ανίχνευσης.</p>}
          </CardContent>
        </Card>

        {/* 4. Session Overview */}
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">Επισκόπηση Συνεδρίας</CardTitle>
            <BarChart2 className="h-5 w-5 text-yellow-500" />
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">Συνολικές Μοναδικές Συσκευές:</p>
              <p className="text-2xl font-bold text-gray-800">{totalUniqueDevicesInSession}</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">Μεγαλύτερη Διάρκεια Παρουσίας:</p>
              <p className="text-2xl font-bold text-gray-800">{formatDuration(longestPresentDuration)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <footer className="text-center pt-4 mt-6 border-t border-gray-300">
        <p className="text-xs text-gray-600 flex items-center justify-center">
          <AlertTriangle className="h-4 w-4 mr-2 text-orange-500" />
          Σημείωση: Τα ονόματα των συσκευών είναι προσωρινά ορατά. Αυτή η συνεδρία θα γίνει επαναφορά σύντομα.
        </p>
      </footer>
       {/* Basic CSS for fadeInRight animation - add to your global CSS or a <style jsx> block if preferred */}
      <style jsx global>{`
        @keyframes fadeInRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-fadeInRight {
          animation: fadeInRight 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}