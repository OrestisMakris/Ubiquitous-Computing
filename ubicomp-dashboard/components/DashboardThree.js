import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Eye, AlertTriangle, Users } from 'lucide-react'; // Target and Brain removed

const ProfileTag = ({ profileType, isHighConcern }) => {
  let bgColor = 'bg-gray-200';
  let textColor = 'text-gray-700';
  let text = profileType.replace('_', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');


  if (profileType === 'real_phone_synthetic') {
    bgColor = 'bg-green-200';
    textColor = 'text-green-800';
    text = `📱 ${text}`;
  } else if (isHighConcern) {
    bgColor = 'bg-yellow-400';
    textColor = 'text-yellow-900';
    text = `⚠️ ${text}`;
  } else if (profileType === 'absence') {
    bgColor = 'bg-red-400';
    textColor = 'text-red-900';
  } else if (profileType === 'generic') {
    bgColor = 'bg-blue-200';
    textColor = 'text-blue-700';
  }


  return (
    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${bgColor} ${textColor} whitespace-nowrap`}>
      {text}
    </span>
  );
};

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
        const confirmedPhoneNames = confirmedPhones.map(p => p.name);

        // 2. Fetch base surveillance profiles from API
        const profilesRes = await fetch('/api/surveillance-profiles-sus', { // Ensure this is your correct API endpoint
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
              display_device_name: phone.name, // Use the real name
              movement_pattern_1: getRandomElement(syntheticMovementPatterns),
              movement_pattern_2: getRandomElement(syntheticTimeDetails),
              movement_pattern_3: getRandomElement(syntheticLocationDetails),
              movement_pattern_4: Math.random() < 0.5 ? getRandomElement(syntheticLocationDetails) : null,
              social_insight_1: getRandomElement(syntheticSocialInsights),
              social_insight_2: Math.random() < 0.5 ? getRandomElement(syntheticBehavioralNotes) : null,
              is_high_concern: Math.random() < 0.2, // 20% chance
              profile_type: 'real_phone_synthetic',
              provocative_note: `📱 Το ${phone.name} μόλις εντοπίστηκε. Ενεργοποιήθηκε ειδικό πρωτόκολλο παρακολούθησης.`,
              isNewActualDevice: phone.isNew // From visible-devices API
            });
          } else {
            // If an API profile exists for this phone, ensure its isNewActualDevice is set
            const existingApiProfile = apiProfiles.find(p => p.device_name_trigger === phone.name || p.display_device_name === phone.name);
            if (existingApiProfile) {
                existingApiProfile.isNewActualDevice = phone.isNew;
            }
          }
        }
        
        let combinedProfiles = [...apiProfiles, ...generatedSyntheticProfilesForRealPhones];

        // Deduplicate again after merging, prioritizing real_phone_synthetic
        const finalUniqueProfilesList = [];
        const seenDisplayNamesForFinal = new Set();
        const seenAbsenceProfileNamesForFinal = new Set();

        // Prioritize real_phone_synthetic
        for (const p of combinedProfiles.filter(prof => prof.profile_type === 'real_phone_synthetic')) {
            if (!seenDisplayNamesForFinal.has(p.display_device_name)) {
                finalUniqueProfilesList.push(p);
                seenDisplayNamesForFinal.add(p.display_device_name);
            }
        }
        // Then other types
        for (const p of combinedProfiles.filter(prof => prof.profile_type !== 'real_phone_synthetic')) {
             if (p.profile_type === 'absence') {
                if (!seenAbsenceProfileNamesForFinal.has(p.profile_name)) {
                    finalUniqueProfilesList.push(p);
                    seenAbsenceProfileNamesForFinal.add(p.profile_name);
                }
            } else { // active or generic
                if (!seenDisplayNamesForFinal.has(p.display_device_name)) {
                    finalUniqueProfilesList.push(p);
                    seenDisplayNamesForFinal.add(p.display_device_name);
                }
            }
        }
        
        // Sort: real_phone_synthetic, then absence, then high_concern, then by name
        finalUniqueProfilesList.sort((a, b) => {
            if (a.profile_type === 'real_phone_synthetic' && b.profile_type !== 'real_phone_synthetic') return -1;
            if (b.profile_type === 'real_phone_synthetic' && a.profile_type !== 'real_phone_synthetic') return 1;
            if (a.profile_type === 'absence' && b.profile_type !== 'absence') return -1;
            if (b.profile_type === 'absence' && a.profile_type !== 'absence') return 1;
            if (a.is_high_concern && !b.is_high_concern) return -1;
            if (b.is_high_concern && !a.is_high_concern) return 1;
            return (a.display_device_name || a.profile_name).localeCompare(b.display_device_name || b.profile_name);
        });

        // Limit the number of profiles displayed, ensuring real_phone_synthetic are prioritized
        let displayableProfiles = [];
        const realPhoneSyntheticProfiles = finalUniqueProfilesList.filter(p => p.profile_type === 'real_phone_synthetic');
        const otherProfiles = finalUniqueProfilesList.filter(p => p.profile_type !== 'real_phone_synthetic');
        
        displayableProfiles.push(...realPhoneSyntheticProfiles);
        if (displayableProfiles.length < MAX_PROFILES_TO_DISPLAY) {
            displayableProfiles.push(...otherProfiles.slice(0, MAX_PROFILES_TO_DISPLAY - displayableProfiles.length));
        }
        displayableProfiles = displayableProfiles.slice(0, MAX_PROFILES_TO_DISPLAY);


        setSurveillanceProfiles(displayableProfiles);

        // 4. Generate Co-location Data (simple version)
        const activeProfileNames = displayableProfiles
          .filter(p => p.profile_type !== 'absence' && p.display_device_name)
          .map(p => p.display_device_name);
        
        const newCoLocationData = [];
        if (activeProfileNames.length >= 2) {
          for (let i = 0; i < Math.min(3, activeProfileNames.length / 2) ; i++) { // Generate up to 3 pairs
            let name1 = activeProfileNames[Math.floor(Math.random() * activeProfileNames.length)];
            let name2 = activeProfileNames[Math.floor(Math.random() * activeProfileNames.length)];
            while (name2 === name1 && activeProfileNames.length > 1) { // Ensure different names if possible
              name2 = activeProfileNames[Math.floor(Math.random() * activeProfileNames.length)];
            }
            if (name1 !== name2) {
                 newCoLocationData.push({
                    pair: `${name1} + ${name2}`,
                    frequency: `${Math.floor(Math.random() * 70) + 30}%` // Random 30-99%
                });
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
    const interval = setInterval(fetchAndProcessData, 15000); // Refresh every 15 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-4 md:p-6 lg:p-8 bg-gray-100 min-h-screen">
      <header className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800">The Watcher</h1>
        <p className="text-md text-gray-600 mt-1">Dynamic Device Surveillance Feed</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-0">
          <Card className="shadow-xl rounded-lg">
            <CardHeader className="bg-gray-800 text-white rounded-t-lg">
              <div className="flex items-center text-2xl font-semibold">
                <Eye className="h-7 w-7 mr-3" />
                Surveillance Feed
              </div>
            </CardHeader>
            <CardContent className="p-0 max-h-[calc(100vh-250px)] overflow-y-auto"> {/* Scrollable content */}
              {isLoading && <p className="p-6 text-gray-500">Φόρτωση δεδομένων παρακολούθησης...</p>}
              {!isLoading && surveillanceProfiles.length === 0 && (
                <p className="p-6 text-gray-600">Δεν υπάρχουν ενεργά προφίλ παρακολούθησης για εμφάνιση. Το σύστημα παρακολουθεί...</p>
              )}
              <ul className="divide-y divide-gray-300">
                {surveillanceProfiles.map((profile) => {
                  let itemClasses = "p-4 hover:bg-gray-50 transition-colors duration-150";
                  if (profile.profile_type === 'real_phone_synthetic') itemClasses += " bg-green-50 border-l-4 border-green-400";
                  else if (profile.is_high_concern) itemClasses += " bg-yellow-50 border-l-4 border-yellow-400";
                  else if (profile.profile_type === 'absence') itemClasses += " bg-red-50 border-l-4 border-red-400";
                  
                  return (
                    <li key={profile.id || profile.profile_name} className={itemClasses}>
                      <div className="flex justify-between items-start mb-2"> {/* items-start for better tag alignment */}
                        <div className="flex items-center space-x-3">
                          {profile.isNewActualDevice && (
                            <span
                              className="px-2 py-0.5 bg-red-100 text-red-700 rounded-md text-xs font-bold shadow-sm"
                            >
                              Νέα!
                            </span>
                          )}
                          <span style={{ fontSize: '1.15rem', lineHeight: '1.6rem', fontWeight: '700', color: 'rgb(0, 19, 159)' }}>
                            {profile.display_device_name}
                          </span>
                        </div>
                        <ProfileTag profileType={profile.profile_type} isHighConcern={profile.is_high_concern} />
                      </div>

                      <div className="ml-1 text-sm text-gray-700 space-y-1">
                        {(profile.profile_type !== 'absence') && (
                          <>
                            <p className="font-semibold text-gray-600">Movement Patterns:</p>
                            {profile.movement_pattern_1 && <p className="pl-2"> {profile.movement_pattern_1}</p>}
                            {profile.movement_pattern_2 && <p className="pl-2"> {profile.movement_pattern_2}</p>}
                            {profile.movement_pattern_3 && <p className="pl-2"> {profile.movement_pattern_3}</p>}
                            {profile.movement_pattern_4 && <p className="pl-2"> {profile.movement_pattern_4}</p>}

                            {(profile.social_insight_1 || profile.social_insight_2) && 
                              <p className="font-semibold text-gray-600 mt-2">Social Insights:</p>
                            }
                            {profile.social_insight_1 && <p className="pl-2"> {profile.social_insight_1}</p>}
                            {profile.social_insight_2 && <p className="pl-2"> {profile.social_insight_2}</p>}
                          </>
                        )}
                        {/* Provocative note display */}
                        {profile.provocative_note && (profile.profile_type !== 'absence' || profile.provocative_note_final) &&
                          <p className={`mt-2 italic ${
                            profile.profile_type === 'real_phone_synthetic' ? 'text-green-700 font-medium' :
                            profile.is_high_concern ? 'text-yellow-700 font-medium' : 
                            profile.profile_type === 'absence' ? 'text-red-700 font-semibold' : 'text-purple-700'
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

        {/* Right Column: Dynamic Co-location */}
        <div className="space-y-6 lg:pt-10">
          <Card className="bg-white shadow-md rounded-lg">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-md font-semibold text-gray-700 flex items-center">
                <Users className="h-5 w-5 mr-2 text-purple-600" /> Dynamic Co-location Watch
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1 space-y-2">
              {coLocationData.length === 0 && <p className="text-xs text-gray-500">No co-location data to display.</p>}
              {coLocationData.map((item, index) => (
                <div key={index}>
                    <p className="text-sm font-medium text-gray-600 mb-0.5">{item.pair}: <span className="font-bold text-purple-700">{item.frequency}</span></p>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-purple-500 h-2.5 rounded-full" style={{ width: item.frequency }}></div>
                    </div>
                </div>
              ))}
            </CardContent>
          </Card>
          {/* Other dynamic panels could be added here if needed */}
        </div>
      </div>

      <footer className="mt-10 py-4 px-6 bg-red-200 border-t-2 border-red-500 rounded-md shadow">
        <p className="text-center text-sm font-semibold text-red-800">
          <AlertTriangle className="inline h-5 w-5 mr-1" />
          WARNING: This is a simulated surveillance demonstration. No actual persistent tracking or cross-session data linkage occurs.
        </p>
      </footer>
    </div>
  );
}