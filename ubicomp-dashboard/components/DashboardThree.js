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


const DetailItem = ({ icon: IconComponent, text, iconColor = "text-slate-500" }) => {
  if (!text) return null;
  return (
    <div className="flex items-start space-x-2 mb-1.5">
      <IconComponent className={`h-4 w-4 ${iconColor} mt-0.5 flex-shrink-0`} />
      <span className="text-slate-700 text-sm">{text}</span>
    </div>
  );
};


export default function DashboardThree() {
  const [surveillanceProfiles, setSurveillanceProfiles] = useState([]);
  const [coLocationData, setCoLocationData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const MAX_PROFILES_TO_DISPLAY = 6; // Adjusted for card layout

  useEffect(() => {
    const fetchAndProcessData = async () => {
      setIsLoading(true);
      try {
        const visibleDevicesRes = await fetch('/api/visible-devices');
        if (!visibleDevicesRes.ok) throw new Error(`Failed to fetch visible devices: ${visibleDevicesRes.statusText}`);
        const visibleDevicesData = await visibleDevicesRes.json();
        const allVisibleDevices = Array.isArray(visibleDevicesData.devices) ? visibleDevicesData.devices : [];

        const confirmedPhones = allVisibleDevices.filter(
          d => d.major_class && d.major_class.toLowerCase() === 'phone'
        );
        const confirmedPhoneDisplayNames = new Set(confirmedPhones.map(p => p.name));

        const profilesRes = await fetch('/api/surveillance-profiles-sus', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ visibleDeviceNames: allVisibleDevices.map(d => d.name) }),
        });
        if (!profilesRes.ok) throw new Error(`Failed to fetch surveillance profiles: ${profilesRes.statusText}`);
        const profilesData = await profilesRes.json();
        let apiProfiles = Array.isArray(profilesData.profiles) ? profilesData.profiles : [];

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
              is_high_concern: Math.random() < 0.3, // Slightly higher chance for real phones
              profile_type: 'real_phone_synthetic',
              provocative_note: `Το ${phone.name} (αναγνωρισμένο τηλέφωνο) παρακολουθείται εντατικά.`,
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

        // --- STICTER FILTERING ---
        const strictlyFilteredProfiles = combinedProfiles.filter(profile => {
            if (profile.profile_type === 'absence' || profile.profile_type === 'real_phone_synthetic') {
                return true; 
            }
            // For 'active' or 'generic', only show if display_device_name is a confirmed phone
            return confirmedPhoneDisplayNames.has(profile.display_device_name);
        });
        
        const finalUniqueProfilesList = [];
        const seenDisplayNamesForFinal = new Set();
        const seenAbsenceProfileNamesForFinal = new Set();

        for (const p of strictlyFilteredProfiles.filter(prof => prof.profile_type === 'real_phone_synthetic')) {
            if (!seenDisplayNamesForFinal.has(p.display_device_name)) {
                finalUniqueProfilesList.push(p);
                seenDisplayNamesForFinal.add(p.display_device_name);
            }
        }
        for (const p of strictlyFilteredProfiles.filter(prof => prof.profile_type !== 'real_phone_synthetic')) {
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
          for (let i = 0; i < Math.min(2, Math.floor(activeProfileNames.length / 1.5)) ; i++) { // Max 2 co-location pairs
            let name1Index = Math.floor(Math.random() * activeProfileNames.length);
            let name2Index = Math.floor(Math.random() * activeProfileNames.length);
            while (name2Index === name1Index && activeProfileNames.length > 1) { 
              name2Index = Math.floor(Math.random() * activeProfileNames.length);
            }
            const pairKey = [activeProfileNames[name1Index], activeProfileNames[name2Index]].sort().join('+');
            if (activeProfileNames[name1Index] !== activeProfileNames[name2Index] && !usedPairs.has(pairKey)) {
                 newCoLocationData.push({
                    pair: `${activeProfileNames[name1Index]} + ${activeProfileNames[name2Index]}`,
                    frequency: `${Math.floor(Math.random() * 60) + 40}%` // 40-99%
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
    <div className="p-4 sm:p-6 md:p-8 bg-slate-100 min-h-screen font-sans">
      <header className="text-center mb-8 sm:mb-12">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-800">The Watcher</h1>
        <p className="text-base sm:text-lg text-slate-600 mt-1 sm:mt-2">Comprehensive Device Tracking System</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Main Surveillance Feed - Now a Grid of Cards */}
        <div className="lg:col-span-2 space-y-5">
            <div className="flex items-center text-xl sm:text-2xl font-semibold text-slate-700 mb-3 sm:mb-4">
                <Eye className="h-6 w-6 sm:h-7 sm:w-7 mr-2.5 text-blue-600" />
                Active Surveillance Profiles
            </div>
            {isLoading && <p className="p-6 text-slate-500 text-center text-lg">Φόρτωση προφίλ...</p>}
            {!isLoading && surveillanceProfiles.length === 0 && (
            <p className="p-6 text-slate-600 text-center text-lg">No active phone-related surveillance profiles to display.</p>
            )}
            {!isLoading && surveillanceProfiles.map((profile) => (
            <div key={profile.id || profile.profile_name} className="bg-white rounded-lg shadow-lg p-4 sm:p-5">
                <div className="flex justify-between items-start mb-3">
                    <div>
                        <h3 className="text-lg sm:text-xl font-semibold text-blue-700">
                            {profile.display_device_name}
                            {profile.isNewActualDevice && (
                                <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-600 rounded-md text-xs font-bold shadow-sm align-middle">
                                Νέα!
                                </span>
                            )}
                        </h3>
                        {profile.profile_type === 'absence' && (
                            <p className="text-xs text-red-600 font-medium">ABSENCE DETECTED</p>
                        )}
                         {profile.profile_type === 'real_phone_synthetic' && (
                            <p className="text-xs text-green-600 font-medium">REAL PHONE - SYNTHETIC PROFILE</p>
                        )}
                    </div>
                    {(profile.is_high_concern || profile.profile_type === 'absence') && (
                        <AlertTriangle className={`h-6 w-6 flex-shrink-0 ${profile.profile_type === 'absence' ? 'text-red-500' : 'text-yellow-500'}`} />
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
                    <div>
                        <h4 className="text-sm font-semibold text-slate-600 mb-1.5">Movement Patterns</h4>
                        <DetailItem icon={MapPin} text={profile.movement_pattern_1} />
                        <DetailItem icon={Clock} text={profile.movement_pattern_2} />
                        <DetailItem icon={MapPin} text={profile.movement_pattern_3} />
                        <DetailItem icon={MapPin} text={profile.movement_pattern_4} />
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-slate-600 mb-1.5">Social Insights</h4>
                        <DetailItem icon={Award} text={profile.social_insight_1} />
                        <DetailItem icon={Search} text={profile.social_insight_2} />
                    </div>
                </div>

                {profile.provocative_note && (
                <div className="mt-3 pt-3 border-t border-slate-200">
                    <p className={`text-sm ${
                        profile.profile_type === 'absence' ? 'text-red-700 font-medium' :
                        profile.is_high_concern ? 'text-yellow-700 font-medium' :
                        profile.profile_type === 'real_phone_synthetic' ? 'text-green-700 font-medium' :
                        'text-slate-600' // Default for generic/active notes
                    }`}>
                    {profile.profile_type === 'absence' ? `⚠️ ${profile.provocative_note_final || profile.provocative_note}` : profile.provocative_note}
                    </p>
                </div>
                )}
            </div>
            ))}
        </div>

        {/* Right Column: Co-location and other static info */}
        <div className="space-y-6 md:space-y-8">
             {/* Co-location Panel - Styled to match new aesthetic */}
            <Card className="bg-white shadow-lg rounded-lg overflow-hidden">
                <CardHeader className="pb-2 pt-3 px-4 sm:px-5 bg-slate-50 border-b border-slate-200">
                    <CardTitle className="text-base sm:text-lg font-semibold text-slate-700 flex items-center">
                        <UsersIcon className="h-5 w-5 mr-2 text-purple-500 flex-shrink-0" /> Co-location Frequency
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                    {isLoading && <p className="text-xs text-slate-500">Loading data...</p>}
                    {!isLoading && coLocationData.length === 0 && <p className="text-xs text-slate-500">No co-location data.</p>}
                    {coLocationData.map((item, index) => (
                        <div key={index}>
                            <p className="text-xs sm:text-sm font-medium text-slate-600 mb-0.5">{item.pair}: <span className="font-bold text-purple-600">{item.frequency}</span></p>
                            <div className="w-full bg-slate-200 rounded-full h-2 sm:h-2.5">
                                <div className="bg-purple-500 h-full rounded-full" style={{ width: item.frequency }}></div>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Placeholder for Tracking Intensity if you want to re-add a simplified version */}
            <Card className="bg-white shadow-lg rounded-lg overflow-hidden">
                <CardHeader className="pb-2 pt-3 px-4 sm:px-5 bg-slate-50 border-b border-slate-200">
                    <CardTitle className="text-base sm:text-lg font-semibold text-slate-700 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 mr-2 text-green-500 flex-shrink-0">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
                        </svg>
                         Tracking Intensity
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4">
                    <div className="w-full bg-slate-200 rounded-full h-2 sm:h-2.5 mb-1">
                        <div className="bg-green-500 h-full rounded-full" style={{ width: '75%' }}></div> {/* Example static value */}
                    </div>
                    <p className="text-xs text-slate-500">High correlation between device movements detected.</p>
                </CardContent>
            </Card>
             {/* Behavioral Predictions Panel - Simplified */}
            <Card className="bg-white shadow-lg rounded-lg overflow-hidden">
                <CardHeader className="pb-2 pt-3 px-4 sm:px-5 bg-slate-50 border-b border-slate-200">
                    <CardTitle className="text-base sm:text-lg font-semibold text-slate-700 flex items-center">
                         <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 mr-2 text-orange-500 flex-shrink-0">
                            <path d="M10 3.5A1.5 1.5 0 0111.5 5v1.645a.75.75 0 001.085.67L14 6.572V7.5a.75.75 0 00.75.75A.75.75 0 0015.5 7.5V5a1.5 1.5 0 00-1.5-1.5h- астро3a1.5 1.5 0 00-1.5 1.5v1.086l-1.293-1.293A1.5 1.5 0 008.207 3H5.5A1.5 1.5 0 004 4.5v11A1.5 1.5 0 005.5 17h9a1.5 1.5 0 001.5-1.5V10.621a2.251 2.251 0 00-.66-1.591L14 7.656V7.5a.75.75 0 00-.75-.75h-.572l1.727-1.727A1.5 1.5 0 0013.036 3H10V1.5A1.5 1.5 0 008.5 0h-3A1.5 1.5 0 004 1.5V3H1.5A1.5 1.5 0 000 4.5v11A1.5 1.5 0 001.5 17h11a1.5 1.5 0 001.5-1.5V13h2.5A1.5 1.5 0 0018 11.5v-3A1.5 1.5 0 0016.5 7H14V5.5A2.5 2.5 0 0011.5 3H10v.5zM6.25 5.5A.75.75 0 017 4.75h.5A.75.75 0 018.25 5.5v.293l-2 2V5.5zm2.543 2.543L6.75 9.293V11.5A.75.75 0 016 12.25v.5A.75.75 0 015.25 13H5a.75.75 0 01-.75-.75V9.707l2.543-2.543zM13.25 10a.75.75 0 01.75.75v3.504l-2.5-2.5V10a.75.75 0 01.75-.75h.5A.75.75 0 0113.25 10z" />
                        </svg>
                        Behavioral Predictions
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 space-y-1">
                    <DetailItem icon={MapPin} text="Predict next likely location" iconColor="text-orange-500"/>
                    <DetailItem icon={Clock} text="Estimate arrival times" iconColor="text-orange-500"/>
                    <DetailItem icon={UsersIcon} text="Correlation with academic performance" iconColor="text-orange-500"/>
                </CardContent>
            </Card>
        </div>
      </div>

      <footer className="mt-10 sm:mt-12 py-4 sm:py-5 px-4 sm:px-6 bg-red-100 border-t-2 border-red-300 rounded-lg shadow-md">
        <p className="text-center text-xs sm:text-sm font-medium text-red-700">
          <AlertTriangle className="inline h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-1.5" />
          WARNING: This is a simulated surveillance demonstration. No actual persistent tracking or cross-session data linkage occurs.
        </p>
      </footer>
    </div>
  );
}