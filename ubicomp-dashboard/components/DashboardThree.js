import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Eye, AlertTriangle, Users } from 'lucide-react'; // Target and Brain removed
const ProfileTag = ({ profileType, isHighConcern }) => {
  let bgColor = 'bg-gray-200';
  let textColor = 'text-gray-700';
  // Improved text formatting for profileType
  let text = profileType.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());

  if (profileType === 'Real Phone Synthetic') { // Match the formatted text
    bgColor = 'bg-green-100'; // Lighter green
    textColor = 'text-green-700';
    text = `📱 ${text}`;
  } else if (isHighConcern) {
    bgColor = 'bg-yellow-100'; // Lighter yellow
    textColor = 'text-yellow-700';
    text = `⚠️ ${text}`;
  } else if (profileType === 'Absence') { // Match the formatted text
    bgColor = 'bg-red-100'; // Lighter red
    textColor = 'text-red-700';
    // No emoji here, it's in the provocative note
  } else if (profileType === 'Generic') { // Match the formatted text
    bgColor = 'bg-blue-100'; // Lighter blue
    textColor = 'text-blue-700';
  }

  return (
    <span className={`px-3 py-1 text-xs sm:text-sm font-medium rounded-full ${bgColor} ${textColor} whitespace-nowrap shadow-sm`}>
      {text}
    </span>
  );
};

// ... (keep existing syntheticMovementPatterns, syntheticTimeDetails, etc., and getRandomElement) ...
// Ensure these arrays are defined as in the previous version.
const syntheticMovementPatterns = [
  "🚩 Κινείται γρήγορα μεταξύ κτιρίων.",
  "🚩 Εντοπίστηκε κοντά σε σημείο ενδιαφέροντος.",
  "🚩 Σταθερή παρουσία σε μια περιοχή για >30 λεπτά.",
  "🚩 Ακολουθεί μια προβλέψιμη διαδρομή.",
  "🚩 Ασυνήθιστη διαδρομή εκτός των γνωστών μοτίβων."
];

const syntheticTimeDetails = [
  "🕒 Τελευταία Θέαση: Μόλις τώρα.",
  "🕒 Ενεργός τα τελευταία 5 λεπτά.",
  "🕒 Εμφανίστηκε πριν από λίγο στο δίκτυο.",
  "🕒 Σύντομη παρουσία, πιθανόν διέλευση."
];

const syntheticLocationDetails = [
  "📍 Πιθανή τοποθεσία: Κυλικείο CEID.",
  "📍 Κοντά στη Βιβλιοθήκη.",
  "📍 Στην κύρια αίθουσα διαλέξεων.",
  "📍 Εξωτερικοί χώροι campus."
];

const syntheticSocialInsights = [
  "🏅 Αλληλεπιδράσεις υπό ανάλυση.",
  "🏅 Πιθανή σύνδεση με άλλη παρακολουθούμενη συσκευή.",
  "🏅 Ανήκει σε κάποιο group ενδιαφέροντος;",
  "🏅 Προσπαθεί να συνδεθεί με πολλαπλά APs."
];

const syntheticBehavioralNotes = [
  "🔍 Νέα συσκευή, απαιτείται προσοχή.",
  "🔍 Η συμπεριφορά αντιστοιχεί σε φοιτητή.",
  "🔍 Υψηλή κινητικότητα, διερευνάται ο σκοπός.",
  "🔍 Μοτίβο χρήσης υπό διαμόρφωση."
];

const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];


export default function DashboardThree() {
  const [surveillanceProfiles, setSurveillanceProfiles] = useState([]);
  const [coLocationData, setCoLocationData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const MAX_PROFILES_TO_DISPLAY = 7;

  // ... (useEffect hook for fetchAndProcessData - keep it exactly as in the previous response) ...
  // For brevity, I'm not repeating the full useEffect. Ensure it's the one from the previous step.
  useEffect(() => {
    const fetchAndProcessData = async () => {
      setIsLoading(true);
      try {
        // 1. Fetch visible devices
        const visibleDevicesRes = await fetch('/api/visible-devices');
        if (!visibleDevicesRes.ok) throw new Error(`Failed to fetch visible devices: ${visibleDevicesRes.statusText}`);
        const visibleDevicesData = await visibleDevicesRes.json();
        const allVisibleDevices = Array.isArray(visibleDevicesData.devices) ? visibleDevicesData.devices : [];

        const confirmedPhones = allVisibleDevices.filter(
          d => d.major_class && d.major_class.toLowerCase() === 'phone'
        );
        // const confirmedPhoneNames = confirmedPhones.map(p => p.name); // Not directly used later, but good for debugging

        // 2. Fetch base surveillance profiles from API
        const profilesRes = await fetch('/api/surveillance-profiles-sus', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ visibleDeviceNames: allVisibleDevices.map(d => d.name) }),
        });
        if (!profilesRes.ok) throw new Error(`Failed to fetch surveillance profiles: ${profilesRes.statusText}`);
        const profilesData = await profilesRes.json();
        let apiProfiles = Array.isArray(profilesData.profiles) ? profilesData.profiles : [];

        // 3. Generate synthetic profiles for real phones not covered by API profiles
        const generatedSyntheticProfilesForRealPhones = [];
        const apiProfileDeviceTriggers = new Set(apiProfiles.map(p => p.device_name_trigger));
        const apiProfileDisplayNames = new Set(apiProfiles.map(p => p.display_device_name));

        for (const phone of confirmedPhones) {
          if (!apiProfileDeviceTriggers.has(phone.name) && !apiProfileDisplayNames.has(phone.name)) {
            generatedSyntheticProfilesForRealPhones.push({
              id: `real-sync-${phone.name}-${Date.now()}`,
              profile_name: `${phone.name}_RealSynthetic`,
              device_name_trigger: phone.name,
              display_device_name: phone.name,
              movement_pattern_1: getRandomElement(syntheticMovementPatterns),
              movement_pattern_2: getRandomElement(syntheticTimeDetails),
              movement_pattern_3: getRandomElement(syntheticLocationDetails),
              movement_pattern_4: Math.random() < 0.5 ? getRandomElement(syntheticLocationDetails) : null,
              social_insight_1: getRandomElement(syntheticSocialInsights),
              social_insight_2: Math.random() < 0.5 ? getRandomElement(syntheticBehavioralNotes) : null,
              is_high_concern: Math.random() < 0.2,
              profile_type: 'real_phone_synthetic',
              provocative_note: `📱 Το ${phone.name} μόλις εντοπίστηκε. Ενεργοποιήθηκε ειδικό πρωτόκολλο παρακολούθησης.`,
              isNewActualDevice: phone.isNew
            });
          } else {
            const existingApiProfile = apiProfiles.find(p => p.device_name_trigger === phone.name || p.display_device_name === phone.name);
            if (existingApiProfile) {
                existingApiProfile.isNewActualDevice = phone.isNew;
            }
          }
        }
        
        let combinedProfiles = [...apiProfiles, ...generatedSyntheticProfilesForRealPhones];

        const finalUniqueProfilesList = [];
        const seenDisplayNamesForFinal = new Set();
        const seenAbsenceProfileNamesForFinal = new Set();

        for (const p of combinedProfiles.filter(prof => prof.profile_type === 'real_phone_synthetic')) {
            if (!seenDisplayNamesForFinal.has(p.display_device_name)) {
                finalUniqueProfilesList.push(p);
                seenDisplayNamesForFinal.add(p.display_device_name);
            }
        }
        for (const p of combinedProfiles.filter(prof => prof.profile_type !== 'real_phone_synthetic')) {
             if (p.profile_type === 'absence') {
                if (!seenAbsenceProfileNamesForFinal.has(p.profile_name)) {
                    finalUniqueProfilesList.push(p);
                    seenAbsenceProfileNamesForFinal.add(p.profile_name);
                }
            } else { 
                if (!seenDisplayNamesForFinal.has(p.display_device_name)) {
                    finalUniqueProfilesList.push(p);
                    seenDisplayNamesForFinal.add(p.display_device_name);
                }
            }
        }
        
        finalUniqueProfilesList.sort((a, b) => {
            if (a.profile_type === 'real_phone_synthetic' && b.profile_type !== 'real_phone_synthetic') return -1;
            if (b.profile_type === 'real_phone_synthetic' && a.profile_type !== 'real_phone_synthetic') return 1;
            if (a.profile_type === 'absence' && b.profile_type !== 'absence') return -1;
            if (b.profile_type === 'absence' && a.profile_type !== 'absence') return 1;
            if (a.is_high_concern && !b.is_high_concern) return -1;
            if (b.is_high_concern && !a.is_high_concern) return 1;
            return (a.display_device_name || a.profile_name).localeCompare(b.display_device_name || b.profile_name);
        });

        let displayableProfiles = [];
        const realPhoneSyntheticProfiles = finalUniqueProfilesList.filter(p => p.profile_type === 'real_phone_synthetic');
        const otherProfiles = finalUniqueProfilesList.filter(p => p.profile_type !== 'real_phone_synthetic');
        
        displayableProfiles.push(...realPhoneSyntheticProfiles);
        if (displayableProfiles.length < MAX_PROFILES_TO_DISPLAY) {
            displayableProfiles.push(...otherProfiles.slice(0, MAX_PROFILES_TO_DISPLAY - displayableProfiles.length));
        }
        displayableProfiles = displayableProfiles.slice(0, MAX_PROFILES_TO_DISPLAY);

        setSurveillanceProfiles(displayableProfiles);

        const activeProfileNames = displayableProfiles
          .filter(p => p.profile_type !== 'absence' && p.display_device_name)
          .map(p => p.display_device_name);
        
        const newCoLocationData = [];
        if (activeProfileNames.length >= 2) {
          const usedPairs = new Set();
          for (let i = 0; i < Math.min(3, Math.floor(activeProfileNames.length / 1.5)) ; i++) { 
            let name1Index = Math.floor(Math.random() * activeProfileNames.length);
            let name2Index = Math.floor(Math.random() * activeProfileNames.length);
            while (name2Index === name1Index && activeProfileNames.length > 1) { 
              name2Index = Math.floor(Math.random() * activeProfileNames.length);
            }
            const pairKey = [activeProfileNames[name1Index], activeProfileNames[name2Index]].sort().join('+');
            if (activeProfileNames[name1Index] !== activeProfileNames[name2Index] && !usedPairs.has(pairKey)) {
                 newCoLocationData.push({
                    pair: `${activeProfileNames[name1Index]} + ${activeProfileNames[name2Index]}`,
                    frequency: `${Math.floor(Math.random() * 70) + 30}%` 
                });
                usedPairs.add(pairKey);
            }
          }
        }
        setCoLocationData(newCoLocationData);

      } catch (error) {
        console.error("DashboardThree fetch error:", error);
        setSurveillanceProfiles([]);
        setCoLocationData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAndProcessData();
    const interval = setInterval(fetchAndProcessData, 15000);
    return () => clearInterval(interval);
  }, []);


  return (
    <div className="p-4 sm:p-6 md:p-8 bg-slate-50 min-h-screen font-sans"> {/* Lighter bg, font-sans */}
      <header className="text-center mb-10">
        <h1 className="text-4xl sm:text-5xl font-bold text-slate-800">The Watcher</h1>
        <p className="text-lg text-slate-600 mt-2">Dynamic Device Surveillance Feed</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2">
          <Card className="shadow-xl rounded-xl overflow-hidden bg-white"> {/* More rounded, bg-white */}
            <CardHeader className="bg-slate-700 text-white p-5 sm:p-6"> {/* Darker header, more padding */}
              <div className="flex items-center text-2xl sm:text-3xl font-semibold">
                <Eye className="h-7 w-7 sm:h-8 sm:w-8 mr-3 flex-shrink-0" />
                Surveillance Feed
              </div>
            </CardHeader>
            <CardContent className="p-0 max-h-[calc(100vh-280px)] overflow-y-auto">
              {isLoading && <p className="p-8 text-slate-500 text-lg">Φόρτωση δεδομένων παρακολούθησης...</p>}
              {!isLoading && surveillanceProfiles.length === 0 && (
                <p className="p-8 text-slate-600 text-lg">Δεν υπάρχουν ενεργά προφίλ παρακολούθησης για εμφάνιση. Το σύστημα παρακολουθεί...</p>
              )}
              <ul className="divide-y divide-slate-200"> {/* Lighter divider */}
                {surveillanceProfiles.map((profile) => {
                  let itemClasses = "p-5 sm:p-6 hover:bg-slate-50 transition-colors duration-150";
                  // Border colors made slightly darker for better visibility on light backgrounds
                  if (profile.profile_type === 'real_phone_synthetic') itemClasses += " border-l-4 border-green-500"; // Darker green
                  else if (profile.is_high_concern) itemClasses += " border-l-4 border-yellow-500"; // Darker yellow
                  else if (profile.profile_type === 'absence') itemClasses += " border-l-4 border-red-500"; // Darker red
                  
                  return (
                    <li key={profile.id || profile.profile_name} className={itemClasses}>
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-4">
                        <div className="flex items-center space-x-3 mb-2 sm:mb-0">
                          {profile.isNewActualDevice && (
                            <span
                              className="px-2.5 py-1 bg-red-100 text-red-600 rounded-md text-xs sm:text-sm font-bold shadow"
                            >
                              Νέα!
                            </span>
                          )}
                          <span className="text-xl sm:text-2xl font-semibold text-slate-800 break-all">
                            {profile.display_device_name}
                          </span>
                        </div>
                        <ProfileTag profileType={profile.profile_type} isHighConcern={profile.is_high_concern} />
                      </div>

                      <div className="ml-1 space-y-2 text-base text-slate-700"> {/* Increased base font, more spacing */}
                        {(profile.profile_type !== 'absence') && (
                          <>
                            <div>
                                <p className="font-semibold text-slate-600 mb-1">Movement Patterns:</p>
                                {profile.movement_pattern_1 && <p className="pl-3 text-slate-600">{profile.movement_pattern_1}</p>}
                                {profile.movement_pattern_2 && <p className="pl-3 text-slate-600">{profile.movement_pattern_2}</p>}
                                {profile.movement_pattern_3 && <p className="pl-3 text-slate-600">{profile.movement_pattern_3}</p>}
                                {profile.movement_pattern_4 && <p className="pl-3 text-slate-600">{profile.movement_pattern_4}</p>}
                            </div>

                            {(profile.social_insight_1 || profile.social_insight_2) && 
                              <div className="mt-3">
                                <p className="font-semibold text-slate-600 mb-1">Social Insights:</p>
                                {profile.social_insight_1 && <p className="pl-3 text-slate-600">{profile.social_insight_1}</p>}
                                {profile.social_insight_2 && <p className="pl-3 text-slate-600">{profile.social_insight_2}</p>}
                              </div>
                            }
                          </>
                        )}
                        {profile.provocative_note &&
                          <p className={`mt-3 pt-2 border-t border-slate-200 text-sm sm:text-base ${
                            profile.profile_type === 'real_phone_synthetic' ? 'text-green-600 font-medium' :
                            profile.is_high_concern ? 'text-yellow-600 font-medium' : 
                            profile.profile_type === 'absence' ? 'text-red-600 font-semibold' : 'text-purple-600 font-medium' // Changed from italic to font-medium
                          }`}>
                            {profile.profile_type === 'absence' ? `⚠️ ${profile.provocative_note_final || profile.provocative_note}` : profile.provocative_note}
                          </p>
                        }
                      </div>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 md:space-y-8 lg:pt-16"> {/* More spacing, adjusted top padding */}
          <Card className="bg-white shadow-lg rounded-xl overflow-hidden"> {/* More rounded, bg-white */}
            <CardHeader className="pb-3 pt-4 px-5 sm:px-6 bg-slate-100 border-b border-slate-200"> {/* Lighter header */}
              <CardTitle className="text-lg sm:text-xl font-semibold text-slate-700 flex items-center">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 mr-2.5 text-purple-500 flex-shrink-0" /> Dynamic Co-location Watch
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 sm:p-6 space-y-3 sm:space-y-4">
              {isLoading && <p className="text-sm text-slate-500">Φόρτωση...</p>}
              {!isLoading && coLocationData.length === 0 && <p className="text-sm text-slate-500">No co-location data to display.</p>}
              {coLocationData.map((item, index) => (
                <div key={index}>
                    <p className="text-base font-medium text-slate-700 mb-1">{item.pair}: <span className="font-bold text-purple-600">{item.frequency}</span></p>
                    <div className="w-full bg-slate-200 rounded-full h-3"> {/* Thicker bar */}
                        <div className="bg-purple-500 h-3 rounded-full" style={{ width: item.frequency }}></div>
                    </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <footer className="mt-12 py-5 px-6 bg-red-100 border-t-2 border-red-300 rounded-lg shadow-md"> {/* Lighter red, more padding */}
        <p className="text-center text-sm sm:text-base font-medium text-red-700">
          <AlertTriangle className="inline h-5 w-5 mr-1.5" />
          WARNING: This is a simulated surveillance demonstration. No actual persistent tracking or cross-session data linkage occurs.
        </p>
      </footer>
    </div>
  );
}