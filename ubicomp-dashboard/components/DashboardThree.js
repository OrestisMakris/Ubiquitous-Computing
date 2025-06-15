import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function DashboardThree() {
  const [apiLastSeen, setApiLastSeen] = useState([]);
  const [apiCooccur,  setApiCooccur]  = useState([]);
  const [apiRoutine,  setApiRoutine]  = useState([]);

  useEffect(() => {
    let live = true;
    async function fetchAll() {
      try {
        const [ls, co, rt] = await Promise.all([
          fetch('/api/pattern-last-seen').then(r => r.json()),
          fetch('/api/pattern-cooccur').then(r => r.json()),
          fetch('/api/pattern-routine').then(r => r.json()),
        ]);
        if (!live) return;
        setApiLastSeen(ls);
        setApiCooccur(co);
        setApiRoutine(rt);
      } catch (error) {
        console.error("Error fetching patterns:", error);
        // Optionally set an error state to display to the user
      }
    }
    fetchAll();
    const iv = setInterval(fetchAll, 10000);
    return () => { live = false; clearInterval(iv); };
  }, []);

  // Process and structure data for display
  const processedProfiles = React.useMemo(() => {
    const profiles = {};

    // Helper to initialize a profile
    const ensureProfile = (name) => {
      if (!profiles[name]) {
        profiles[name] = {
          device_name: name,
          is_real_device: false,
          movement_patterns: [],
          social_insights_cooccur: [],
          social_insights_routine: [],
        };
      }
      return profiles[name];
    };

    // 1. Process `apiLastSeen` (contains real "Last Seen: <timestamp>" and synthetic movement patterns)
    apiLastSeen.forEach(item => {
      const profile = ensureProfile(item.device_name);
      if (item.message.startsWith("Last Seen:")) { // Identifies a real, active device's primary status
        profile.movement_patterns.unshift(item.message); // Real "Last Seen" always first
        profile.is_real_device = true;
      } else { // Synthetic movement pattern
        profile.movement_patterns.push(item.message);
      }
    });

    // 2. Process `apiCooccur`
    apiCooccur.forEach(item => {
      const profile = ensureProfile(item.device_name);
      profile.social_insights_cooccur.push(item.message);
    });

    // 3. Process `apiRoutine`
    apiRoutine.forEach(item => {
      const profile = ensureProfile(item.device_name);
      profile.social_insights_routine.push(item.message);
    });
    
    // Deduplicate messages within each category for each profile
    Object.values(profiles).forEach(profile => {
        profile.movement_patterns = [...new Set(profile.movement_patterns)];
        profile.social_insights_cooccur = [...new Set(profile.social_insights_cooccur)];
        profile.social_insights_routine = [...new Set(profile.social_insights_routine)];
    });


    // 4. Sort and cap for display
    const allProfilesArray = Object.values(profiles);
    const realProfiles = allProfilesArray.filter(p => p.is_real_device);
    // Optionally sort realProfiles further, e.g., by parsing the "Last Seen" timestamp if needed
    const fakeProfiles = allProfilesArray.filter(p => !p.is_real_device);
    // Optionally shuffle fakeProfiles for variety: fakeProfiles.sort(() => 0.5 - Math.random());

    let visible = [];
    if (realProfiles.length >= 20) {
      visible = realProfiles.slice(0, 20);
    } else {
      visible = [...realProfiles];
      const fakesNeeded = 20 - realProfiles.length;
      visible.push(...fakeProfiles.slice(0, fakesNeeded));
    }
    return visible;

  }, [apiLastSeen, apiCooccur, apiRoutine]);


  return (
    <div>
      <header className="text-center py-4">
        <h2 className="text-3xl font-bold">Active Surveillance Profiles</h2>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {processedProfiles.map((dev, i) => (
          <Card key={`${dev.device_name}-${i}`}> {/* More stable key */}
            <CardHeader>
              <CardTitle>
                <strong className="text-blue-600">{dev.device_name}</strong>
                {/* Optional: Indicate if real for debugging: dev.is_real_device && <span className="text-green-500 ml-2">(Real)</span> */}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <h4 className="font-semibold">Movement Patterns</h4>
                {dev.movement_patterns.length > 0
                  ? dev.movement_patterns.map((m, j) => (
                      <div key={j} className="flex items-center py-1">
                        <span>📍</span><span className="ml-2">{m}</span>
                      </div>
                    ))
                  : <p className="text-gray-500">— none —</p>
                }
              </div>
              <div className="mt-4">
                <h4 className="font-semibold">Social Insights</h4>
                {dev.social_insights_cooccur.length > 0
                  ? dev.social_insights_cooccur.map((m, j) => (
                      <div key={j} className="flex items-center py-1">
                        <span>👥</span><span className="ml-2">{m}</span>
                      </div>
                    ))
                  : null /* Or <p className="text-gray-500">— no co-occurrences —</p> if you want to show something */
                }
                {dev.social_insights_routine.length > 0
                  ? dev.social_insights_routine.map((m, j) => (
                      <div key={j} className="flex items-center py-1">
                        <span>⏱️</span><span className="ml-2">{m}</span>
                      </div>
                    ))
                  : null /* Or <p className="text-gray-500">— no routines —</p> */
                }
                {dev.social_insights_cooccur.length === 0 && dev.social_insights_routine.length === 0 &&
                    <p className="text-gray-500">— none —</p>
                }
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}