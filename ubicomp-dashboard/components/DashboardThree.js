import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Eye, AlertTriangle, Target, Users, Brain } from 'lucide-react';

// Phone identification helper (copied from DashboardTwo for consistency)
const PHONE_KEYWORDS = [
  'iphone', 'galaxy', 'pixel', 'xperia', 'oneplus', 'moto', 
  'redmi', 'poco', 'oppo', 'vivo', 'realme', 'nokia', 'android', 'ios',
  'phone', 'mobile', 'smartphone' 
];

function isLikelyPhone(deviceName) {
  if (!deviceName || typeof deviceName !== 'string') {
    return false;
  }
  const lowerDeviceName = deviceName.toLowerCase();
  return PHONE_KEYWORDS.some(keyword => lowerDeviceName.includes(keyword));
}

const ProfileTag = ({ profileType, isHighConcern }) => {
  let bgColor = 'bg-gray-200';
  let textColor = 'text-gray-700';
  let text = profileType.charAt(0).toUpperCase() + profileType.slice(1);

  if (isHighConcern) {
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
    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${bgColor} ${textColor}`}>
      {text}
    </span>
  );
};


export default function DashboardThree() {
  const [surveillanceProfiles, setSurveillanceProfiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfiles = async () => {
      setIsLoading(true);
      try {
        // 1. Fetch all visible devices
        const visibleDevicesRes = await fetch('/api/visible-devices');
        if (!visibleDevicesRes.ok) throw new Error('Failed to fetch visible devices');
        const visibleDevicesData = await visibleDevicesRes.json();
        const allVisibleDevices = Array.isArray(visibleDevicesData.devices) ? visibleDevicesData.devices : [];

        // 2. Filter for phones and identify new ones
        const visiblePhones = allVisibleDevices.filter(d => isLikelyPhone(d.name));
        const visiblePhoneNames = visiblePhones.map(p => p.name);
        const newVisiblePhoneNames = new Set(visiblePhones.filter(p => p.isNew).map(p => p.name));

        // 3. Fetch surveillance profiles based on visible phone names
        // Also include non-phone specific absence profiles by sending a broader request or handling in API
        // For now, API will filter based on what it receives + add all absence profiles
        const profilesRes = await fetch('/api/surveillance-profiles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // Send all visible names, API can decide to show non-phone absence profiles
          // Or send only phone names if strict phone-only view for active profiles is desired
          body: JSON.stringify({ visibleDeviceNames: allVisibleDevices.map(d => d.name) }),
        });
        if (!profilesRes.ok) throw new Error(`Failed to fetch surveillance profiles: ${profilesRes.statusText}`);
        const profilesData = await profilesRes.json();
        
        let fetchedProfiles = Array.isArray(profilesData.profiles) ? profilesData.profiles : [];

        // 4. Enrich profiles with 'isNewActualDevice' and filter for phone-related or general absence
        const enrichedAndFilteredProfiles = fetchedProfiles.map(p => {
          const isTriggeredByPhone = visiblePhoneNames.includes(p.device_name_trigger) ||
                                   (p.device_name_trigger && p.device_name_trigger.endsWith('%') && visiblePhoneNames.some(name => name.toLowerCase().startsWith(p.device_name_trigger.slice(0, -1).toLowerCase())));
          const isDisplayedPhone = isLikelyPhone(p.display_device_name);

          return {
            ...p,
            isNewActualDevice: newVisiblePhoneNames.has(p.display_device_name) || (p.device_name_trigger && newVisiblePhoneNames.has(p.device_name_trigger)),
            // Determine if this profile should be shown:
            // - It's an absence profile (these are general alerts)
            // - OR its display_device_name is a phone
            // - OR it was triggered by a phone device name
            // - OR it's a generic profile meant for any device (if we want to show these for phones)
            showProfile: p.profile_type === 'absence' || isDisplayedPhone || isTriggeredByPhone || (p.profile_type === 'generic' && isTriggeredByPhone)
          };
        }).filter(p => p.showProfile);


        setSurveillanceProfiles(enrichedAndFilteredProfiles);

      } catch (error) {
        console.error("DashboardThree fetch error:", error);
        setSurveillanceProfiles([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfiles();
    const interval = setInterval(fetchProfiles, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-4 md:p-6 lg:p-8 bg-gray-100 min-h-screen">
      <header className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800">The Watcher</h1>
        <p className="text-md text-gray-600 mt-1">Comprehensive Device Tracking System</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-0"> {/* Changed space-y-6 to space-y-0 */}
          <Card className="shadow-xl rounded-lg">
            <CardHeader className="bg-gray-800 text-white rounded-t-lg">
              <div className="flex items-center text-2xl font-semibold">
                <Eye className="h-7 w-7 mr-3" />
                Active Surveillance Profiles
              </div>
            </CardHeader>
            <CardContent className="p-0"> {/* Removed padding from CardContent */}
              {isLoading && <p className="p-6 text-gray-500">Φόρτωση δεδομένων παρακολούθησης...</p>}
              {!isLoading && surveillanceProfiles.length === 0 && (
                <p className="p-6 text-gray-600">Δεν υπάρχουν ενεργά προφίλ παρακολούθησης για εμφάνιση. Το σύστημα παρακολουθεί...</p>
              )}
              <ul className="divide-y divide-gray-300">
                {surveillanceProfiles.map((profile) => {
                  let itemClasses = "p-4 hover:bg-gray-50 transition-colors duration-150";
                  if (profile.is_high_concern) itemClasses += " bg-yellow-50 border-l-4 border-yellow-400";
                  if (profile.profile_type === 'absence') itemClasses += " bg-red-50 border-l-4 border-red-400";
                  
                  return (
                    <li key={profile.id || profile.profile_name} className={itemClasses}>
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center space-x-3">
                          {profile.isNewActualDevice && (
                            <span
                              style={{
                                paddingLeft: '0.6rem', paddingRight: '0.6rem', paddingTop: '0.2rem', paddingBottom: '0.2rem',
                                backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '0.5rem',
                                fontSize: '0.9rem', lineHeight: '1.25rem', fontWeight: '700',
                                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                              }}
                            >
                              Νέα!
                            </span>
                          )}
                          <span style={{ fontSize: '1.25rem', lineHeight: '1.75rem', fontWeight: '700', color: 'rgb(0, 19, 159)' }}>
                            {profile.display_device_name}
                          </span>
                        </div>
                        <ProfileTag profileType={profile.profile_type} isHighConcern={profile.is_high_concern} />
                      </div>

                      <div className="ml-1 text-sm text-gray-700 space-y-1">
                        {(profile.profile_type !== 'absence') && (
                          <>
                            <p className="font-semibold text-gray-600">Movement Patterns:</p>
                            {profile.movement_pattern_1 && <p className="pl-2">{profile.movement_pattern_1}</p>}
                            {profile.movement_pattern_2 && <p className="pl-2">{profile.movement_pattern_2}</p>}
                            {profile.movement_pattern_3 && <p className="pl-2">{profile.movement_pattern_3}</p>}
                            {profile.movement_pattern_4 && <p className="pl-2">{profile.movement_pattern_4}</p>}

                            {(profile.social_insight_1 || profile.social_insight_2) && 
                              <p className="font-semibold text-gray-600 mt-2">Social Insights:</p>
                            }
                            {profile.social_insight_1 && <p className="pl-2">{profile.social_insight_1}</p>}
                            {profile.social_insight_2 && <p className="pl-2">{profile.social_insight_2}</p>}
                          </>
                        )}
                        {/* Provocative note for active/generic, or the main text for absence */}
                        {profile.provocative_note && (profile.profile_type !== 'absence' || !profile.provocative_note_final) &&
                          <p className={`mt-2 italic ${profile.is_high_concern ? 'text-yellow-700 font-medium' : 'text-purple-700'}`}>
                            {profile.provocative_note}
                          </p>
                        }
                        {profile.profile_type === 'absence' && profile.provocative_note_final &&
                           <p className="mt-2 font-semibold text-red-700">{profile.provocative_note_final}</p>
                        }
                      </div>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Info Panels (Static as per design) */}
        <div className="space-y-6 lg:pt-10">
          <Card className="bg-white shadow-md rounded-lg">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-md font-semibold text-gray-700 flex items-center">
                <Target className="h-5 w-5 mr-2 text-green-600" /> Tracking Intensity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1">
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
                <div className="bg-green-500 h-2.5 rounded-full" style={{ width: '75%' }}></div>
              </div>
              <p className="text-xs text-gray-500">High correlation between device movements detected.</p>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-md rounded-lg">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-md font-semibold text-gray-700 flex items-center">
                <Users className="h-5 w-5 mr-2 text-purple-600" /> Co-location Frequency
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1">
              <p className="text-sm font-medium text-gray-600 mb-1">Phone_Alex + Airpods_Chris: <span className="font-bold text-purple-700">89%</span></p>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-purple-500 h-2.5 rounded-full" style={{ width: '89%' }}></div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-md rounded-lg">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-md font-semibold text-gray-700 flex items-center">
                <Brain className="h-5 w-5 mr-2 text-red-600" /> Behavioral Predictions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1 space-y-1">
              <p className="text-xs text-gray-600">🚩 Predict next likely location</p>
              <p className="text-xs text-gray-600">🕒 Estimate arrival times</p>
              <p className="text-xs text-gray-600">📊 Correlation with academic performance</p>
            </CardContent>
          </Card>
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