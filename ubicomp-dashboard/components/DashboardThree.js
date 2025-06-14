import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Eye, AlertTriangle, Users, MapPin, Clock, Search, Award } from 'lucide-react';

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
const syntheticMovementPatterns = [
  "Περνάει από τον σαρωτή Α (Νέο Κτίριο CEID) καθημερινά στις 8:30 π.μ.",
  "Συχνές μετακινήσεις μεταξύ Κυλικείου και Εργαστηρίων Η/Υ",
  "Ασυνεπής παρουσία στο campus",
  "Σταθερή παρουσία κοντά στον server room του CEID",
  "Κινείται γρήγορα μεταξύ κτιρίων",
  "Εντοπίστηκε κοντά στην είσοδο του Νέου Κτιρίου CEID",
  "Η δραστηριότητα μειώνεται τις ηλιόλουστες μέρες",
  "Συχνές διελεύσεις από το Νέο Κτίριο του CEID"
];

const syntheticTimeDetails = [
  "Τελευταία Θέαση: Τετάρτη 14:30 κοντά στο Κυλικείο CEID",
  "Τελευταία Θέαση: Τρίτη 19:45 κοντά στο ΙΤΥΕ 'Διόφαντος'",
  "Τελευταία Θέαση: Στο υπόγειο, κοντά στο E-Sports Club",
  "Τελευταία Θέαση: Πριν 2 ώρες κοντά στην Πρυτανεία",
  "Τελευταία Θέαση: Χθες, απολαμβάνοντας τον ήλιο στο γκαζόν του campus",
  "Πιθανόν επισκέπτης ή νέος φοιτητής",
  "Υψηλή μεταφορά δεδομένων προς εξωτερικούς IP",
  "Τελευταία δραστηριότητα: Πριν 2 ώρες"
];

const syntheticLocationDetails = [
  "Πρωί: Αίθουσα Ε0.1",
  "Απόγευμα: Αίθουσα Σεμιναρίων",
  "Βράδυ: Κυλικείο Πανεπιστημιούπολης",
  "Βράδυ: Ενεργός στο δίκτυο του Πανεπιστημίου, πιθανόν για gaming",
  "Κινείται προς τις αίθουσες διδασκαλίας",
  "Λειτουργεί κυρίως εκτός ωραρίου γραφείου",
  "Τοποθεσία: Άγνωστη όταν έχει καλό καιρό",
  "Πρωί: Συνήθως ήσυχη παρουσία"
];

const syntheticSocialInsights = [
  "Ομάδες: Ομάδα Ρομποτικής CEID, Κύκλος Μελέτης Αλγορίθμων",
  "Ομάδες: Θεατρική Ομάδα Πανεπιστημίου Πατρών, Φωτογραφικός Όμιλος",
  "Ομάδες: E-Sports Club Patras, Anime Fan Group",
  "Κοινωνικός Κύκλος: Άγνωστος, περνάει απαρατήρητος/η",
  "Κοινωνικές Προτιμήσεις: Εκτιμά τον εξωτερικό χώρο",
  "Συνδέσεις: Κρυπτογραφημένες, μη αναγνωρίσιμες",
  "Αλληλεπιδράσεις: Ελάχιστες προς το παρόν",
  "Αλληλεπιδράσεις: Κάτω από το κανονικό"
];

const syntheticBehavioralNotes = [
  "Συμπεριφορική Σημείωση: Φαίνεται να δίνει προτεραιότητα στις ακαδημαϊκές υποχρεώσεις. Ή μήπως όχι;",
  "Συμπεριφορική Σημείωση: Πιθανές δυσκολίες ισορροπίας μεταξύ φοιτητικής ζωής και διαβάσματος",
  "Συμπεριφορική Σημείωση: Υψηλή κατανάλωση bandwidth τις νυχτερινές ώρες",
  "Συμπεριφορική Σημείωση: Φαίνεται τυπικός φοιτητής/τρια. Ή μήπως όχι;",
  "Συμπεριφορική Σημείωση: Όταν έχει καλό καιρό, εξαφανίζεται. Προτεραιότητα στην έξοδο, ε;",
  "Συμπεριφορική Σημείωση: Δραστηριότητα χρήζει διερεύνησης",
  "Συμπεριφορική Σημείωση: Εξερευνά τον χώρο",
  "Συμπεριφορική Σημείωση: Νέα συσκευή, απαιτείται προσοχή"
];

// More varied absence scenarios
const absentDeviceScenarios = [
  {
    name: "Galaxy_Nikos",
    type: "PhD Student",
    message: "Το Galaxy του Νίκου δεν έχει εμφανιστεί στο δίκτυο εδώ και 3 μέρες. Έχει τελειώσει τη διατριβή του;"
  },
  {
    name: "iPhone_Maria",
    type: "Professor",
    message: "Η Καθηγήτρια Μαρία δεν έχει συνδεθεί από το γραφείο της εδώ και μια εβδομάδα. Είναι σε συνέδριο;"
  },
  {
    name: "Pixel_Andreas",
    type: "Lab Assistant", 
    message: "Ο Andreas δεν έχει εμφανιστεί στο εργαστήριο από την Παρασκευή. Οι φοιτητές ρωτάνε για τα μαθήματά τους."
  },
  {
    name: "OnePlus_Katerina",
    type: "MSc Student",
    message: "Η Κατερίνα απουσιάζει από τα μαθήματα εδώ και 5 μέρες. Το τηλέφωνό της δεν εντοπίζεται πουθενά στο campus."
  }
];

const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];

const DetailItem = ({ icon: IconComponent, text, iconColor = "text-slate-500" }) => {
  if (!text) return null;
  return (
    <div className="flex items-start space-x-2 mb-2">
      <IconComponent className={`h-4 w-4 ${iconColor} mt-0.5 flex-shrink-0`} />
      <span className="text-slate-700 text-sm leading-relaxed">{text}</span>
    </div>
  );
};

export default function DashboardThree() {
  const [surveillanceProfiles, setSurveillanceProfiles] = useState([]);
  const [coLocationData, setCoLocationData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const MAX_PROFILES_TO_DISPLAY = 6;

  useEffect(() => {
    const fetchAndProcessData = async () => {
      setIsLoading(true);
      try {
        const visibleDevicesRes = await fetch('/api/visible-devices');
        if (!visibleDevicesRes.ok) throw new Error(`Failed to fetch visible devices: ${visibleDevicesRes.statusText}`);
        const visibleDevicesData = await visibleDevicesRes.json();
        const allVisibleDevices = Array.isArray(visibleDevicesData.devices) ? visibleDevicesData.devices : [];

        // STRICT PHONE FILTERING - Only devices with major_class = 'Phone'
        const confirmedPhones = allVisibleDevices.filter(
          d => d.major_class && d.major_class.toLowerCase() === 'phone'
        );
        const confirmedPhoneDisplayNames = new Set(confirmedPhones.map(p => p.name));

        // Generate synthetic absence profiles (randomly select 1-2)
        const numAbsenceProfiles = Math.floor(Math.random() * 2) + 1; // 1 or 2
        const selectedAbsenceScenarios = [];
        const shuffledScenarios = [...absentDeviceScenarios].sort(() => 0.5 - Math.random());
        
        for (let i = 0; i < Math.min(numAbsenceProfiles, shuffledScenarios.length); i++) {
          const scenario = shuffledScenarios[i];
          // Only add if this device is NOT currently visible
          if (!confirmedPhoneDisplayNames.has(scenario.name)) {
            selectedAbsenceScenarios.push({
              id: `absence-${scenario.name}-${Date.now()}`,
              profile_name: `${scenario.name}_Absence`,
              device_name_trigger: scenario.name,
              display_device_name: `${scenario.name} (${scenario.type})`,
              profile_type: 'absence',
              is_high_concern: true,
              provocative_note: scenario.message
            });
          }
        }

        // Generate synthetic profiles for real phones
        const generatedSyntheticProfilesForRealPhones = [];
        for (const phone of confirmedPhones) {
          generatedSyntheticProfilesForRealPhones.push({
            id: `real-sync-${phone.name}-${Date.now()}`,
            profile_name: `${phone.name}_RealSynthetic`,
            device_name_trigger: phone.name,
            display_device_name: phone.name,
            movement_pattern_1: getRandomElement(syntheticMovementPatterns),
            movement_pattern_2: getRandomElement(syntheticTimeDetails),
            movement_pattern_3: getRandomElement(syntheticLocationDetails),
            movement_pattern_4: Math.random() < 0.7 ? getRandomElement(syntheticLocationDetails) : null,
            social_insight_1: getRandomElement(syntheticSocialInsights),
            social_insight_2: Math.random() < 0.8 ? getRandomElement(syntheticBehavioralNotes) : null,
            is_high_concern: Math.random() < 0.25,
            profile_type: 'real_phone_synthetic',
            provocative_note: Math.random() < 0.6 ? `📱 Το ${phone.name} παρακολουθείται με ειδικό πρωτόκολλο. Σημαντικές πληροφορίες συλλέγονται.` : null,
            isNewActualDevice: phone.isNew
          });
        }
        
        // Combine absence and real phone profiles ONLY
        let combinedProfiles = [...selectedAbsenceScenarios, ...generatedSyntheticProfilesForRealPhones];

        // Sort: absence first, then real phones, high concern prioritized
        combinedProfiles.sort((a, b) => {
          if (a.profile_type === 'absence' && b.profile_type !== 'absence') return -1;
          if (b.profile_type === 'absence' && a.profile_type !== 'absence') return 1;
          if (a.is_high_concern && !b.is_high_concern) return -1;
          if (b.is_high_concern && !a.is_high_concern) return 1;
          return (a.display_device_name || a.profile_name).localeCompare(b.display_device_name || b.profile_name);
        });

        // Limit profiles displayed
        const displayableProfiles = combinedProfiles.slice(0, MAX_PROFILES_TO_DISPLAY);
        setSurveillanceProfiles(displayableProfiles);

        // Generate co-location data only from real phones
        const activePhoneNames = generatedSyntheticProfilesForRealPhones.map(p => p.display_device_name);
        const newCoLocationData = [];
        if (activePhoneNames.length >= 2) {
          const usedPairs = new Set();
          for (let i = 0; i < Math.min(2, Math.floor(activePhoneNames.length / 1.5)); i++) {
            let name1Index = Math.floor(Math.random() * activePhoneNames.length);
            let name2Index = Math.floor(Math.random() * activePhoneNames.length);
            while (name2Index === name1Index && activePhoneNames.length > 1) { 
              name2Index = Math.floor(Math.random() * activePhoneNames.length);
            }
            const pairKey = [activePhoneNames[name1Index], activePhoneNames[name2Index]].sort().join('+');
            if (activePhoneNames[name1Index] !== activePhoneNames[name2Index] && !usedPairs.has(pairKey)) {
              newCoLocationData.push({
                pair: `${activePhoneNames[name1Index]} + ${activePhoneNames[name2Index]}`,
                frequency: `${Math.floor(Math.random() * 60) + 40}%`
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
    <div className="p-4 sm:p-6 md:p-8 bg-gray-50 min-h-screen font-sans">
      <header className="text-center mb-8 sm:mb-12">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-800">The Watcher</h1>
        <p className="text-base sm:text-lg text-gray-600 mt-1 sm:mt-2">Dynamic Device Surveillance Feed</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Main Surveillance Feed - Card Layout */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center text-xl sm:text-2xl font-semibold text-gray-700 mb-4">
            <Eye className="h-6 w-6 sm:h-7 sm:w-7 mr-2.5 text-blue-600" />
            Surveillance Feed
          </div>
          
          {isLoading && (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <p className="text-gray-500 text-lg">Φόρτωση προφίλ παρακολούθησης...</p>
            </div>
          )}
          
          {!isLoading && surveillanceProfiles.length === 0 && (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <p className="text-gray-600 text-lg">Δεν υπάρχουν ενεργά προφίλ παρακολούθησης.</p>
            </div>
          )}
          
          {!isLoading && surveillanceProfiles.map((profile) => (
            <div key={profile.id || profile.profile_name} className="bg-white rounded-lg shadow-md p-5 sm:p-6 border-l-4 border-blue-500">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold text-blue-700">
                    {profile.display_device_name}
                    {profile.isNewActualDevice && (
                      <span className="ml-2 px-2 py-1 bg-red-100 text-red-600 rounded-md text-xs font-bold shadow-sm">
                        Νέα!
                      </span>
                    )}
                  </h3>
                  {profile.profile_type === 'absence' && (
                    <p className="text-sm text-red-600 font-medium mt-1">ABSENCE DETECTED</p>
                  )}
                  {profile.profile_type === 'real_phone_synthetic' && (
                    <p className="text-sm text-green-600 font-medium mt-1">ACTIVE PHONE TRACKING</p>
                  )}
                </div>
                {(profile.is_high_concern || profile.profile_type === 'absence') && (
                  <AlertTriangle className={`h-6 w-6 flex-shrink-0 ${profile.profile_type === 'absence' ? 'text-red-500' : 'text-yellow-500'}`} />
                )}
              </div>

              {profile.profile_type !== 'absence' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">Movement Patterns</h4>
                    <DetailItem icon={MapPin} text={profile.movement_pattern_1} iconColor="text-blue-500" />
                    <DetailItem icon={Clock} text={profile.movement_pattern_2} iconColor="text-green-500" />
                    <DetailItem icon={MapPin} text={profile.movement_pattern_3} iconColor="text-purple-500" />
                    <DetailItem icon={MapPin} text={profile.movement_pattern_4} iconColor="text-orange-500" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">Social Insights</h4>
                    <DetailItem icon={Award} text={profile.social_insight_1} iconColor="text-yellow-500" />
                    <DetailItem icon={Search} text={profile.social_insight_2} iconColor="text-indigo-500" />
                  </div>
                </div>
              )}

              {profile.provocative_note && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className={`text-sm font-medium ${
                    profile.profile_type === 'absence' ? 'text-red-700' :
                    profile.is_high_concern ? 'text-yellow-700' :
                    profile.profile_type === 'real_phone_synthetic' ? 'text-green-700' :
                    'text-gray-600'
                  }`}>
                    {profile.profile_type === 'absence' ? `⚠️ ${profile.provocative_note}` : profile.provocative_note}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Right Column: Info Panels */}
        <div className="space-y-6">
          <Card className="bg-white shadow-md rounded-lg">
            <CardHeader className="pb-3 pt-4 px-5 bg-gray-50 border-b border-gray-200">
              <CardTitle className="text-lg font-semibold text-gray-700 flex items-center">
                <Users className="h-5 w-5 mr-2 text-purple-500" /> Co-location Frequency
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-3">
              {isLoading && <p className="text-sm text-gray-500">Loading data...</p>}
              {!isLoading && coLocationData.length === 0 && <p className="text-sm text-gray-500">No co-location data.</p>}
              {coLocationData.map((item, index) => (
                <div key={index}>
                  <p className="text-sm font-medium text-gray-600 mb-1">{item.pair}: <span className="font-bold text-purple-600">{item.frequency}</span></p>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-purple-500 h-full rounded-full" style={{ width: item.frequency }}></div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-white shadow-md rounded-lg">
            <CardHeader className="pb-3 pt-4 px-5 bg-gray-50 border-b border-gray-200">
              <CardTitle className="text-lg font-semibold text-gray-700 flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-green-500" /> Tracking Intensity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                <div className="bg-green-500 h-full rounded-full" style={{ width: '78%' }}></div>
              </div>
              <p className="text-xs text-gray-500">High correlation between device movements detected.</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <footer className="mt-10 py-4 px-6 bg-red-100 border-t-2 border-red-300 rounded-lg shadow-md">
        <p className="text-center text-sm font-medium text-red-700">
          <AlertTriangle className="inline h-5 w-5 mr-1.5" />
          WARNING: This is a simulated surveillance demonstration. No actual persistent tracking or cross-session data linkage occurs.
        </p>
      </footer>
    </div>
  );
}