import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Eye, AlertTriangle, Users } from 'lucide-react';

// Enhanced movement patterns with more emojis and variety
const syntheticMovementPatterns = [
  "� Passes scanner B daily at 8:30 AM",
  "⏰ Last Seen: Wednesday 14:30",
  "🏢 Morning: Academic Zone", 
  "🍽️ Afternoon: Cafeteria",
  "📱 Inconsistent campus presence",
  "🕐 Last Seen: Tuesday 19:45",
  "🌃 Evening: Recreation Center",
  "📚 Sporadic library visits",
  "🚶 Frequently co-located with other devices",
  "🕒 Last Seen: Thursday 12:15",
  "🍕 Lunch Areas",
  "📖 Study Spaces",
  "🏃 Κινείται γρήγορα μεταξύ κτιρίων",
  "📍 Εντοπίστηκε κοντά στο Κυλικείο CEID",
  "⌚ Σταθερή παρουσία >30 λεπτά",
  "🚪 Συχνές διελεύσεις από το Νέο Κτίριο"
];

const syntheticSocialInsights = [
  "🎮 Clubs: Gaming Club, Study Group",
  "🎭 Clubs: Drama Society", 
  "🗣️ Clubs: Debate Team",
  "⚡ Behavioral Note: Prioritizing fun over exam prep?",
  "⚖️ Behavioral Note: Potential work-life balance struggles",
  "🤝 Behavioral Note: Close social collaboration detected",
  "🎯 Ομάδες: Ομάδα Ρομποτικής CEID",
  "🎪 Ομάδες: Θεατρική Ομάδα Πατρών",
  "🎮 Ομάδες: E-Sports Club Patras",
  "📱 Συμπεριφορική Σημείωση: Υψηλή κατανάλωση bandwidth",
  "🔍 Αλληλεπιδράσεις υπό ανάλυση",
  "👥 Κοινωνικός Κύκλος: Διάφορες συνδέσεις"
];

// More varied absence scenarios with emojis
const absentDeviceScenarios = [
  {
    name: "Laptop_Sofia",
    type: "CompSci Student",
    message: "💻 Είναι καλά το 'Laptop_Sofia'; Δεν εντοπίστηκε από κανέναν σαρωτή του campus από χθες το πρωί. Παρακολουθούμε στενά."
  },
  {
    name: "Tablet_Maria", 
    type: "PhD Candidate",
    message: "📱 Το Tablet της Μαρίας δεν έχει συνδεθεί στο δίκτυο εδώ και 48 ώρες. Έχει παραδώσει την εργασία της;"
  },
  {
    name: "Galaxy_Nikos",
    type: "Lab Assistant",
    message: "📞 Το Galaxy του Νίκου εξαφανίστηκε από το εργαστήριο. Οι φοιτητές ρωτάνε για τα μαθήματά τους!"
  },
  {
    name: "iPhone_Andreas",
    type: "Professor", 
    message: "📵 Ο Καθηγητής Andreas δεν έχει συνδεθεί εδώ και μια εβδομάδα. Σε συνέδριο ή σε διακοπές;"
  },
  {
    name: "OnePlus_Katerina",
    type: "MSc Student",
    message: "🔍 Η Κατερίνα απουσιάζει 5 μέρες από τα μαθήματα. Το τηλέφωνό της αδιάφορο στις κλήσεις του δικτύου."
  }
];

const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];

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

        // STRICT PHONE FILTERING
        const confirmedPhones = allVisibleDevices.filter(
          d => d.major_class && d.major_class.toLowerCase() === 'phone'
        );
        const confirmedPhoneDisplayNames = new Set(confirmedPhones.map(p => p.name));

        // Generate 1-2 random absence profiles
        const numAbsenceProfiles = Math.floor(Math.random() * 2) + 1;
        const selectedAbsenceScenarios = [];
        const shuffledScenarios = [...absentDeviceScenarios].sort(() => 0.5 - Math.random());
        
        for (let i = 0; i < Math.min(numAbsenceProfiles, shuffledScenarios.length); i++) {
          const scenario = shuffledScenarios[i];
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

        // Generate profiles for real phones with varied data
        const generatedPhoneProfiles = [];
        for (const phone of confirmedPhones) {
          // Get 4 random movement patterns
          const shuffledMovements = [...syntheticMovementPatterns].sort(() => 0.5 - Math.random());
          const movements = shuffledMovements.slice(0, 4);
          
          // Get 2 random social insights  
          const shuffledSocial = [...syntheticSocialInsights].sort(() => 0.5 - Math.random());
          const socialInsights = shuffledSocial.slice(0, 2);

          generatedPhoneProfiles.push({
            id: `phone-${phone.name}-${Date.now()}`,
            profile_name: `${phone.name}_Profile`,
            device_name_trigger: phone.name,
            display_device_name: phone.name,
            movement_pattern_1: movements[0] || null,
            movement_pattern_2: movements[1] || null, 
            movement_pattern_3: movements[2] || null,
            movement_pattern_4: movements[3] || null,
            social_insight_1: socialInsights[0] || null,
            social_insight_2: socialInsights[1] || null,
            is_high_concern: Math.random() < 0.3, // 30% chance
            profile_type: 'active_phone',
            provocative_note: Math.random() < 0.4 ? `� Το ${phone.name} υπό εντατική παρακολούθηση. Κρίσιμες πληροφορίες συλλέγονται.` : null,
            isNewActualDevice: phone.isNew
          });
        }
        
        // Combine profiles
        let combinedProfiles = [...selectedAbsenceScenarios, ...generatedPhoneProfiles];

        // Sort: absence first, then high concern, then alphabetical
        combinedProfiles.sort((a, b) => {
          if (a.profile_type === 'absence' && b.profile_type !== 'absence') return -1;
          if (b.profile_type === 'absence' && a.profile_type !== 'absence') return 1;
          if (a.is_high_concern && !b.is_high_concern) return -1;
          if (b.is_high_concern && !a.is_high_concern) return 1;
          return (a.display_device_name || a.profile_name).localeCompare(b.display_device_name || b.profile_name);
        });

        const displayableProfiles = combinedProfiles.slice(0, MAX_PROFILES_TO_DISPLAY);
        setSurveillanceProfiles(displayableProfiles);

        // Generate co-location data from active phones
        const activePhoneNames = generatedPhoneProfiles.map(p => p.display_device_name);
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
                frequency: `${Math.floor(Math.random() * 50) + 50}%` // 50-99%
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
    <div className="p-6 bg-gray-100 min-h-screen">
      <header className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800">The Watcher</h1>
        <p className="text-lg text-gray-600 mt-2">Comprehensive Device Tracking System</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Surveillance Feed */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b">
              <div className="flex items-center text-xl font-semibold text-gray-700">
                <Eye className="h-6 w-6 mr-3 text-blue-600" />
                Active Surveillance Profiles
              </div>
            </div>
            
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {isLoading && (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-lg">🔄 Φόρτωση προφίλ παρακολούθησης...</p>
                </div>
              )}
              
              {!isLoading && surveillanceProfiles.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-600 text-lg">📵 Δεν υπάρχουν ενεργά προφίλ.</p>
                </div>
              )}
              
              {!isLoading && surveillanceProfiles.map((profile) => (
                <div key={profile.id || profile.profile_name} className="bg-gray-50 rounded-lg p-5 border-l-4 border-blue-500">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-blue-700 flex items-center">
                        {profile.display_device_name}
                        {profile.isNewActualDevice && (
                          <span className="ml-2 px-2 py-1 bg-red-100 text-red-600 rounded text-xs font-bold">
                            Νέα!
                          </span>
                        )}
                      </h3>
                      {profile.profile_type === 'absence' && (
                        <p className="text-sm text-red-600 font-medium mt-1">⚠️ ABSENCE</p>
                      )}
                    </div>
                    {(profile.is_high_concern || profile.profile_type === 'absence') && (
                      <AlertTriangle className={`h-6 w-6 ${profile.profile_type === 'absence' ? 'text-red-500' : 'text-yellow-500'}`} />
                    )}
                  </div>

                  {profile.profile_type !== 'absence' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-600 mb-2 uppercase">Movement Patterns</h4>
                        {profile.movement_pattern_1 && <p className="text-sm text-gray-700 mb-1">{profile.movement_pattern_1}</p>}
                        {profile.movement_pattern_2 && <p className="text-sm text-gray-700 mb-1">{profile.movement_pattern_2}</p>}
                        {profile.movement_pattern_3 && <p className="text-sm text-gray-700 mb-1">{profile.movement_pattern_3}</p>}
                        {profile.movement_pattern_4 && <p className="text-sm text-gray-700 mb-1">{profile.movement_pattern_4}</p>}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-600 mb-2 uppercase">Social Insights</h4>
                        {profile.social_insight_1 && <p className="text-sm text-gray-700 mb-1">{profile.social_insight_1}</p>}
                        {profile.social_insight_2 && <p className="text-sm text-gray-700 mb-1">{profile.social_insight_2}</p>}
                      </div>
                    </div>
                  )}

                  {profile.provocative_note && (
                    <div className="mt-4 pt-3 border-t border-gray-300">
                      <p className={`text-sm font-medium ${
                        profile.profile_type === 'absence' ? 'text-red-700' :
                        profile.is_high_concern ? 'text-yellow-700' :
                        'text-green-700'
                      }`}>
                        {profile.provocative_note}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Co-location Panel */}
          <Card className="bg-white shadow-lg">
            <CardHeader className="pb-3 pt-4 px-5 bg-gray-50 border-b">
              <CardTitle className="text-lg font-semibold text-gray-700 flex items-center">
                <Users className="h-5 w-5 mr-2 text-purple-500" /> 📍 Co-location Frequency
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-3">
              {isLoading && <p className="text-sm text-gray-500">🔄 Loading data...</p>}
              {!isLoading && coLocationData.length === 0 && <p className="text-sm text-gray-500">📵 No co-location data.</p>}
              {coLocationData.map((item, index) => (
                <div key={index}>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    {item.pair}: <span className="font-bold text-purple-600">{item.frequency}</span>
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-purple-500 h-full rounded-full" style={{ width: item.frequency }}></div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Tracking Intensity */}
          <Card className="bg-white shadow-lg">
            <CardHeader className="pb-3 pt-4 px-5 bg-gray-50 border-b">
              <CardTitle className="text-lg font-semibold text-gray-700 flex items-center">
                🎯 Tracking Intensity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                <div className="bg-green-500 h-full rounded-full" style={{ width: '83%' }}></div>
              </div>
              <p className="text-xs text-gray-500">📈 High correlation between device movements detected</p>
            </CardContent>
          </Card>

          {/* Behavioral Predictions */}
          <Card className="bg-white shadow-lg">
            <CardHeader className="pb-3 pt-4 px-5 bg-gray-50 border-b">
              <CardTitle className="text-lg font-semibold text-gray-700 flex items-center">
                🧠 Behavioral Predictions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-2">
              <p className="text-sm text-gray-600">🎯 Predict next likely location</p>
              <p className="text-sm text-gray-600">⏰ Estimate arrival times</p>
              <p className="text-sm text-gray-600">📊 Correlation with academic performance</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <footer className="mt-10 py-4 px-6 bg-red-100 border-t-2 border-red-300 rounded-lg shadow-md">
        <p className="text-center text-sm font-medium text-red-700">
          <AlertTriangle className="inline h-5 w-5 mr-1.5" />
          ⚠️ WARNING: This is a simulated surveillance demonstration. No actual persistent tracking occurs.
        </p>
      </footer>
    </div>
  );
}