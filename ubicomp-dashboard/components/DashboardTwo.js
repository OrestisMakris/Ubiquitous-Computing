import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
// ... other imports like BarChart if still used elsewhere ...

// Constants for the proximity plot
const RSSI_CENTER_PLOT = -30; // Strongest signal (closest to center)
const RSSI_EDGE_PLOT = -90;   // Weakest signal (at the edge of the plot area)
const RSSI_RANGE_PLOT = RSSI_CENTER_PLOT - RSSI_EDGE_PLOT;
const BUBBLE_DIAMETER = 16; // pixels
const BUBBLE_RADIUS = BUBBLE_DIAMETER / 2;

export default function DashboardTwo() {
  const [devices, setDevices] = useState([]);
  const [hist, setHist] = useState([]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [visResponse, evResponse] = await Promise.all([
          fetch('/api/visible-devices'),
          fetch('/api/device-events')
        ]);
        
        if (!visResponse.ok) throw new Error(`Failed to fetch visible devices: ${visResponse.status}`);
        if (!evResponse.ok) throw new Error(`Failed to fetch device events: ${evResponse.status}`);

        const vis = await visResponse.json();
        const ev = await evResponse.json();
        
        setDevices(vis.devices || []); // Ensure devices is always an array

        // build 15-minute histogram for the other card
        const now = Date.now();
        const bins = Array.from({ length: 15 }, (_, i) => ({
          time: `${-(15 - i)}′`, count: 0
        }));
        if (ev.events && Array.isArray(ev.events)) {
          ev.events.forEach(e => {
            const diff = Math.floor((now - new Date(e.timestamp).getTime()) / 60000);
            if (diff >= 0 && diff < 15) {
              bins[bins.length - 1 - diff].count++;
            }
          });
        }
        setHist(bins);

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setDevices([]); // Reset to empty on error
        setHist(Array.from({ length: 15 }, (_, i) => ({ time: `${-(15 - i)}′`, count: 0 })));
      }
    };
    fetchAll();
    const iv = setInterval(fetchAll, 5000);
    return () => clearInterval(iv);
  }, []);

  // The 'groups' variable is no longer directly used for rendering this specific card,
  // but the logic might be useful if you have other components relying on it.
  // For this card, we'll iterate over 'devices' directly.

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
        {/* 1. Devices Currently Visible Card (remains as previously styled) */}
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
                            paddingRight: '0.75rem',
                            paddingTop: '0.25rem',
                            paddingBottom: '0.25rem',
                            backgroundColor: '#fee2e2',
                            color: '#dc2626',
                            borderRadius: '0.5rem',
                            fontSize: '1rem',
                            lineHeight: '1.5rem',
                            fontWeight: '700',
                            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                          }}
                        >
                          Νέα!
                        </span>
                      )}
                      <span
                        style={{
                          fontSize: '1.5rem',
                          lineHeight: '2rem',
                          fontWeight: '700',
                          color: '#000000',
                        }}
                      >
                        {d.name}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: '1.5rem',
                        lineHeight: '2rem',
                        color: '#000000',
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

        {/* 2. Proximity Clusters (NEW CIRCULAR PLOT) */}
        <Card>
          <CardHeader>
            <CardTitle>📶 Ομαδοποίηση Κατ’ Εγγύτητα</CardTitle>
            <p className="text-xs text-gray-500 pt-1">Πιο κοντά στο κέντρο = Πιο ισχυρό σήμα</p>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-72"> {/* Fixed height for the plot area */}
            {devices.length > 0 ? (
              <div
                className="relative w-60 h-60" // Plot container size (240px x 240px)
              >
                {/* Background Circle */}
                <div className="absolute inset-0 bg-green-100 rounded-full border-2 border-green-300"></div>

                {/* Concentric Rings (Optional Visual Guide) */}
                <div className="absolute top-1/2 left-1/2 w-2/3 h-2/3 border border-green-200 border-dashed rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute top-1/2 left-1/2 w-1/3 h-1/3 border border-green-200 border-dashed rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>


                {/* Device Bubbles */}
                {devices.map((device, index) => {
                  if (typeof device.rssi !== 'number') return null; // Skip if RSSI is not valid

                  // 1. Clamp RSSI to our defined plot range
                  const clampedRssi = Math.max(RSSI_EDGE_PLOT, Math.min(device.rssi, RSSI_CENTER_PLOT));
                  
                  // 2. Calculate strength ratio (0 for weakest at edge, 1 for strongest at center)
                  //    (RSSI_CENTER_PLOT - clampedRssi) because RSSI_CENTER_PLOT is less negative (stronger)
                  const strengthRatio = RSSI_RANGE_PLOT !== 0 ? (RSSI_CENTER_PLOT - clampedRssi) / RSSI_RANGE_PLOT : 0.5;
                  
                  // 3. Distance ratio from center (0 for center, 1 for edge)
                  const distanceRatio = 1 - strengthRatio;

                  // 4. Angle for distribution
                  const angle = (index / devices.length) * 2 * Math.PI;

                  // 5. Max radius for bubbles within the plot area
                  const plotAreaRadius = (240 / 2) - BUBBLE_RADIUS - 5; // 240px is w-60, subtract bubble radius and a small padding

                  // 6. Calculate radial distance
                  const radialDistance = distanceRatio * plotAreaRadius;

                  // 7. Calculate offsets from the center of the plot container
                  const offsetX = radialDistance * Math.cos(angle);
                  const offsetY = radialDistance * Math.sin(angle);

                  // 8. Final position for the bubble (top-left corner)
                  //    '50%' centers it, then apply offset, then adjust by bubble radius to center the bubble itself
                  const bubbleStyle = {
                    left: `calc(50% + ${offsetX}px - ${BUBBLE_RADIUS}px)`,
                    top: `calc(50% + ${offsetY}px - ${BUBBLE_RADIUS}px)`,
                    width: `${BUBBLE_DIAMETER}px`,
                    height: `${BUBBLE_DIAMETER}px`,
                  };

                  return (
                    <div
                      key={device.pseudonym}
                      title={`${device.name} (RSSI: ${device.rssi} dBm)`}
                      className="absolute bg-green-500 rounded-full shadow-md transform transition-all duration-500 ease-in-out"
                      style={bubbleStyle}
                    ></div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 italic">Δεν εντοπίστηκαν συσκευές για ομαδοποίηση.</p>
            )}
          </CardContent>
        </Card>

        {/* 3. Recent Detection Timeline Card (remains as previously styled) */}
        {/* ... ensure this card's code is here ... */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>⏱️ Χρονογράφημα Σημάτων (τελευταία ~15′)</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Assuming you are using Recharts or similar for BarResp, BarChart etc. */}
            {/* Ensure BarResp, BarChart, XAxis, YAxis, Tooltip, Bar are imported if used */}
            {/* <BarResp width="100%" height={150}>
              <BarChart data={hist}>
                <XAxis
                  dataKey="time"
                  ticks={['-15′','-10′','-5′','-2′','-1′']}
                  tick={{ fontSize: 10 }}
                />
                <YAxis domain={[0, 'dataMax']} hide={true} />
                <Tooltip />
                <Bar dataKey="count" fill="#0017a5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </BarResp> */}
             {hist.length > 0 && hist.some(h => h.count > 0) ? (
                <div className="flex items-end justify-around h-32 space-x-1 pt-2">
                  {hist.map((bin, idx) => (
                    <div key={idx} className="flex flex-col items-center flex-1">
                      <div
                        title={`${bin.count} events`}
                        className="w-full bg-[#0017a5] rounded-t hover:bg-blue-700 transition-colors"
                        style={{ height: `${Math.min(100, (bin.count / (Math.max(...hist.map(h => h.count), 1))) * 100)}%` }}
                      ></div>
                      <span className="text-xs text-gray-500 mt-1">{bin.time.replace('′','')}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">Κανένα πρόσφατο σήμα.</p>
              )}
          </CardContent>
        </Card>

      </div>

      <Card className="mx-auto max-w-lg">
        <CardContent className="pt-6"> {/* Added pt-6 for padding if needed */}
          <p className="text-center text-sm text-gray-600">
            🔒 Δεν διατηρούμε μακροχρόνιο ιστορικό. Όλα τα ονόματα εμφανίζονται για λίγα δευτερόλεπτα μόνο.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}