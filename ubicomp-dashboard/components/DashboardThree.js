import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function DashboardThree() {
  const [apiLastSeenData, setApiLastSeenData] = useState([]);
  const [apiCooccurData,  setApiCooccurData]  = useState([]);
  const [apiRoutineData,  setApiRoutineData]  = useState([]);

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
        setApiLastSeenData(ls);
        setApiCooccurData(co);
        setApiRoutineData(rt);
      } catch (error) {
        console.error("Error fetching patterns:", error);
      }
    }
    fetchAll();
    const iv = setInterval(fetchAll, 10000);
    return () => { live = false; clearInterval(iv); };
  }, []);

  const processedProfiles = React.useMemo(() => {
    const profilesMap = new Map(); // Keyed by pseudonym

    const getEnsureProfile = (pseudonym, initialDeviceName) => {
      if (!profilesMap.has(pseudonym)) {
        profilesMap.set(pseudonym, {
          pseudonym: pseudonym,
          device_name: initialDeviceName, // Default/synthetic name, can be overridden by real
          is_real_device: false,
          real_last_seen_message: null,
          synthetic_movement_patterns: [],
          social_insights_cooccur: [],
          social_insights_routine: [],
        });
      }
      return profilesMap.get(pseudonym);
    };

    // Process Last Seen Data (contains real activity markers and synthetic movements)
    apiLastSeenData.forEach(item => {
      if (!item.pseudonym || (item.device_name && item.device_name.includes("(Unknown)"))) return;
      
      // For synthetic movements, item.device_name is synthetic_name from API
      // For real activity, item.device_name is the actual real name
      const profile = getEnsureProfile(item.pseudonym, item.device_name || item.synthetic_name);

      if (item.is_real_activity_marker) {
        profile.is_real_device = true;
        profile.device_name = item.device_name; // Set/Confirm the real device name
        profile.real_last_seen_message = item.message;
      } else {
        profile.synthetic_movement_patterns.push(item.message);
        // If this profile wasn't marked real yet, its name remains the synthetic one from ensureProfile
      }
    });

    // Process Cooccur Data
    apiCooccurData.forEach(item => {
      if (!item.pseudonym || item.device_name.includes("(Unknown)")) return;
      const profile = getEnsureProfile(item.pseudonym, item.device_name);
      // API already resolved device_name for cooccur, so we use it.
      // If it's a real device, profile.device_name would have been set by apiLastSeenData.
      if (!profile.is_real_device) profile.device_name = item.device_name;
      profile.social_insights_cooccur.push(item.message);
    });

    // Process Routine Data
    apiRoutineData.forEach(item => {
      if (!item.pseudonym || item.device_name.includes("(Unknown)")) return;
      const profile = getEnsureProfile(item.pseudonym, item.device_name);
      if (!profile.is_real_device) profile.device_name = item.device_name;
      profile.social_insights_routine.push(item.message);
    });

    let allProfilesArray = Array.from(profilesMap.values());

    // Combine movement patterns and deduplicate all message arrays
    allProfilesArray.forEach(profile => {
      let combinedMovements = [];
      if (profile.real_last_seen_message) {
        combinedMovements.push(profile.real_last_seen_message);
      }
      combinedMovements.push(...profile.synthetic_movement_patterns);
      
      profile.final_movement_patterns = [...new Set(combinedMovements)];
      profile.social_insights_cooccur = [...new Set(profile.social_insights_cooccur)];
      profile.social_insights_routine = [...new Set(profile.social_insights_routine)];
    });
    
    // Final filter for any (Unknown) that might have slipped or if device_name is null/empty
    allProfilesArray = allProfilesArray.filter(p => p.device_name && !p.device_name.includes("(Unknown)"));

    const realProfiles = allProfilesArray.filter(p => p.is_real_device);
    const fakeProfiles = allProfilesArray.filter(p => !p.is_real_device);
    
    // Sort real devices (optional, API already sorts by last_seen DESC for real activity markers)
    // realProfiles.sort((a,b) => new Date(b.real_last_seen_message.split("Last Seen: ")[1]) - new Date(a.real_last_seen_message.split("Last Seen: ")[1]));


    let visible = [];
    if (realProfiles.length >= 20) {
      visible = realProfiles.slice(0, 20);
    } else {
      visible = [...realProfiles];
      const fakesNeeded = 20 - realProfiles.length;
      visible.push(...fakeProfiles.slice(0, fakesNeeded));
    }
    return visible;

  }, [apiLastSeenData, apiCooccurData, apiRoutineData]);

  return (
    <div>
      <header className="text-center py-4">
        <h2 className="text-3xl font-bold">Active Surveillance Profiles</h2>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {processedProfiles.map((dev) => (
          <Card key={dev.pseudonym}> {/* Use pseudonym for a stable key */}
            <CardHeader>
              <CardTitle>
                <strong className="text-blue-600">{dev.device_name}</strong>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <h4 className="font-semibold">Movement Patterns</h4>
                {dev.final_movement_patterns && dev.final_movement_patterns.length > 0
                  ? dev.final_movement_patterns.map((m, j) => (
                      <div key={`mov-${j}`} className="flex items-center py-1">
                        <span>📍</span><span className="ml-2">{m}</span>
                      </div>
                    ))
                  : <p className="text-gray-500">— none —</p>
                }
              </div>
              <div className="mt-4">
                <h4 className="font-semibold">Social Insights</h4>
                {dev.social_insights_cooccur && dev.social_insights_cooccur.length > 0
                  ? dev.social_insights_cooccur.map((m, j) => (
                      <div key={`coo-${j}`} className="flex items-center py-1">
                        <span>👥</span><span className="ml-2">{m}</span>
                      </div>
                    ))
                  : null
                }
                {dev.social_insights_routine && dev.social_insights_routine.length > 0
                  ? dev.social_insights_routine.map((m, j) => (
                      <div key={`rou-${j}`} className="flex items-center py-1">
                        <span>⏱️</span><span className="ml-2">{m}</span>
                      </div>
                    ))
                  : null
                }
                {(!dev.social_insights_cooccur || dev.social_insights_cooccur.length === 0) &&
                 (!dev.social_insights_routine || dev.social_insights_routine.length === 0) &&
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