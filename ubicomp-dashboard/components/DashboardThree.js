import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card3';

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
    // Dashboard data updates every 10 seconds
    const iv = setInterval(fetchAll, 10000);
    return () => { live = false; clearInterval(iv); };
  }, []);

  const processedProfiles = React.useMemo(() => {
    const profilesMap = new Map(); // Keyed by pseudonym

    const getEnsureProfile = (pseudonym, initialDeviceName) => {
      if (!profilesMap.has(pseudonym)) {
        profilesMap.set(pseudonym, {
          pseudonym: pseudonym,
          device_name: initialDeviceName, 
          is_real_device: false,
          real_last_seen_message: null,
          synthetic_movement_patterns: [],
          social_insights_cooccur: [],
          social_insights_routine: [],
        });
      }
      return profilesMap.get(pseudonym);
    };

    apiLastSeenData.forEach(item => {
      // Skip if pseudonym is missing or if it's a synthetic item with an (Unknown) name
      if (!item.pseudonym || (!item.is_real_activity_marker && item.synthetic_name && item.synthetic_name.includes("(Unknown)"))) return;
      // For real activity, item.device_name is used. For synthetic, item.synthetic_name.
      const profile = getEnsureProfile(item.pseudonym, item.is_real_activity_marker ? item.device_name : item.synthetic_name);

      if (item.is_real_activity_marker) {
        profile.is_real_device = true;
        profile.device_name = item.device_name; 
        profile.real_last_seen_message = item.message;
      } else {
        // Only add synthetic movement if it's not for an (Unknown) synthetic name
        if (item.synthetic_name && !item.synthetic_name.includes("(Unknown)")) {
            profile.synthetic_movement_patterns.push(item.message);
        }
      }
    });

    apiCooccurData.forEach(item => {
      if (!item.pseudonym || item.device_name.includes("(Unknown)")) return;
      const profile = getEnsureProfile(item.pseudonym, item.device_name);
      if (!profile.is_real_device) profile.device_name = item.device_name; // Ensure name is set if only seen in cooccur/routine
      profile.social_insights_cooccur.push(item.message);
    });

    apiRoutineData.forEach(item => {
      if (!item.pseudonym || item.device_name.includes("(Unknown)")) return;
      const profile = getEnsureProfile(item.pseudonym, item.device_name);
      if (!profile.is_real_device) profile.device_name = item.device_name; // Ensure name is set
      profile.social_insights_routine.push(item.message);
    });

    let allProfilesArray = Array.from(profilesMap.values());

    allProfilesArray.forEach(profile => {
      const realMsg    = profile.real_last_seen_message;
      const synthetic  = profile.synthetic_movement_patterns;

      // pick synthetic "Last spotted..." messages
      const lastSpotted = synthetic.filter(m => m.startsWith("Last spotted"));
      // pick synthetic time-of-day snippets (matches morning/afternoon/etc)
      const timeOfDay   = synthetic.filter(m =>
        /(morning|afternoon|midday|evening)/i.test(m)
      );

      let finalMovements = [];

      if (profile.is_real_device) {
        // 1) real device: real timestamp
        if (realMsg) finalMovements.push(realMsg);
        // 2) add one time-of-day if available
        if (timeOfDay.length) finalMovements.push(timeOfDay[0]);
      } else {
        // 1) fake device: one synthetic "Last spotted..."
        if (lastSpotted.length) finalMovements.push(lastSpotted[0]);
        // 2) one time-of-day snippet
        if (timeOfDay.length)   finalMovements.push(timeOfDay[0]);
      }

      // dedupe & assign
      profile.final_movement_patterns = [...new Set(finalMovements)];
    });
    
    // Final filter for any (Unknown) names that might have been set initially or if device_name is null/empty
    allProfilesArray = allProfilesArray.filter(p => p.device_name && !p.device_name.includes("(Unknown)"));

    const realProfiles = allProfilesArray.filter(p => p.is_real_device);
    const fakeProfiles = allProfilesArray.filter(p => !p.is_real_device);
    
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
        <div
    className="p-4 md:p-6 bg-gray-50 min-h-screen"
     style={{ fontSize: '1.22em' }}    // ↑ scale all text by 1.5×
   >
      <header className="text-center py-6 mb-8">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-800 tracking-tight">
          <span role="img" aria-label="eye" className="mr-2">👁️</span>
          Ενεργή Παρακολούθηση Συσκευών ? Dashboard 3
        </h1>
      </header>
      <div className="max-w-screen-xl mx-auto grid grid-cols-1 gap-6 xl:gap-8">
        {processedProfiles.map((dev) => (
          <Card key={dev.pseudonym} className="bg-white shadow-xl hover:shadow-2xl transition-shadow duration-300 rounded-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-slate-200 to-slate-300 p-4 border-b border-slate-400">
              <CardTitle className="text-xl md:text-2xl font-bold text-slate-800 truncate flex items-center">
                <span role="img" aria-label="device" className="mr-2 text-2xl">🌐</span>
                {dev.device_name}
 
              </CardTitle>
            </CardHeader>
<CardContent className="p-5 text-base">
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div>
      <h4 className="text-[1.8rem] font-bold mb-2 flex items-center">
        <span className="mr-2 text-xl">📍</span>Movement Patterns
      </h4>
      {dev.final_movement_patterns.length
        ? dev.final_movement_patterns
            .slice(0, 4)
            .map((m, j) => (
              <div key={j} className="flex items-start py-1">
                <span className="mr-2 text-lg">🗺️</span>
                <span>{m}</span>
              </div>
            ))
        : <p className="italic text-gray-500">— none —</p>
      }
    </div>
    <div>
      <h4 className="text-[1.8rem] font-bold mb-2 flex items-center">
        <span className="mr-2 text-xl">💬</span>Social Insights
      </h4>
    {dev.social_insights_cooccur.length
      ? dev.social_insights_cooccur
          .slice(0, 4)
          .map((m, j) => (
            <div key={j} className="flex items-start py-1">
              <span className="mr-2 text-lg">{/* …icon logic… */}</span>
              <span>{m}</span>
            </div>
          ))
      : <p className="italic text-gray-500">— none —</p>
    }
      {dev.social_insights_routine.map((m,j)=>(
        <div key={`r${j}`} className="flex items-start py-1">
          <span className="mr-2 text-lg">⏱️</span><span>{m}</span>
        </div>
      ))}
    </div>
  </div>
</CardContent>
          </Card>
        ))}
      </div>
          <Card className="mx-auto max-w-lg">
        <CardContent>
          <p className="text-center text-2xl md:text-3xl font-extrabold text-gray-800">
            ⚠️ ΠΡΟΕΙΔΟΠΟΙΗΣΗ: Αυτή είναι μια προσομοιωμένη επίδειξη επιτήρησης. Δεν πραγματοποιείται καμία πραγματική επίμονη παρακολούθηση.
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

