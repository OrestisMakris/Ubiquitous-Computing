import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Eye, AlertTriangle } from 'lucide-react'; // Target, Users, Brain removed

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
    const fetchAndProcessProfiles = async () => {
      setIsLoading(true);
      try {
        // 1. Fetch all visible devices (assuming they include 'major_class' and 'isNew')
        const visibleDevicesRes = await fetch('/api/visible-devices');
        if (!visibleDevicesRes.ok) throw new Error(`Failed to fetch visible devices: ${visibleDevicesRes.statusText}`);
        const visibleDevicesData = await visibleDevicesRes.json();
        const allVisibleDevices = Array.isArray(visibleDevicesData.devices) ? visibleDevicesData.devices : [];

        // 2. Identify confirmed real phones and their 'isNew' status
        const confirmedRealPhones = allVisibleDevices.filter(
          d => d.major_class && d.major_class.toLowerCase() === 'phone'
        );
        const newConfirmedRealPhoneNames = new Set(
          confirmedRealPhones.filter(p => p.isNew).map(p => p.name)
        );

        // 3. Fetch candidate surveillance profiles from the API
        // The API is expected to return:
        //    - All 'absence' profiles.
        //    - 'active'/'generic' profiles whose device_name_trigger matches any of the 'allVisibleDevices' names.
        const profilesApiRes = await fetch('/api/surveillance-profiles-sus', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ visibleDeviceNames: allVisibleDevices.map(d => d.name) }),
        });
        if (!profilesApiRes.ok) throw new Error(`Failed to fetch surveillance profiles: ${profilesApiRes.statusText}`);
        const profilesData = await profilesApiRes.json();
        
        const fetchedSyntheticProfiles = Array.isArray(profilesData.profiles) ? profilesData.profiles : [];
        
        const profilesToDisplay = [];
        const displayedRealPhoneSyntheticMatches = new Set(); // To avoid duplicating generic profiles for the same real phone if logic gets complex

        // 4. Process fetched synthetic profiles
        for (const syntheticProfile of fetchedSyntheticProfiles) {
          if (syntheticProfile.profile_type === 'absence') {
            profilesToDisplay.push({
              ...syntheticProfile,
              // For absence, display_device_name is from DB. isNewActualDevice checks if this named device is a new phone.
              isNewActualDevice: newConfirmedRealPhoneNames.has(syntheticProfile.display_device_name),
              // id for key can be syntheticProfile.id or profile_name
              unique_key: syntheticProfile.profile_name || `absence-${syntheticProfile.id}`,
            });
          } else if (syntheticProfile.profile_type === 'active' || syntheticProfile.profile_type === 'generic') {
            // Check if this synthetic profile was triggered by any of our confirmedRealPhones
            for (const realPhone of confirmedRealPhones) {
              let matches = false;
              if (syntheticProfile.device_name_trigger) {
                if (syntheticProfile.device_name_trigger.endsWith('%')) {
                  const prefix = syntheticProfile.device_name_trigger.slice(0, -1).toLowerCase();
                  if (realPhone.name.toLowerCase().startsWith(prefix)) {
                    matches = true;
                  }
                } else if (syntheticProfile.device_name_trigger === realPhone.name) {
                  matches = true;
                }
              }

              if (matches) {
                // Use real phone's name for display, but synthetic profile's details
                // Create a unique key to prevent adding the same realPhone+syntheticProfile combo multiple times if loops overlap
                const displayKey = `real-${realPhone.name}-synth-${syntheticProfile.profile_name}`;
                if (!displayedRealPhoneSyntheticMatches.has(displayKey)) {
                    profilesToDisplay.push({
                        ...syntheticProfile, // All details from synthetic
                        display_device_name: realPhone.name, // Override with real phone's name
                        isNewActualDevice: newConfirmedRealPhoneNames.has(realPhone.name),
                        unique_key: displayKey,
                    });
                    displayedRealPhoneSyntheticMatches.add(displayKey);
                }
              }
            }
          }
        }
        
        // Deduplicate profilesToDisplay just in case (e.g. an absence profile name matches a real phone name)
        // Using a Map for simple deduplication based on the generated unique_key
        const finalUniqueProfiles = Array.from(new Map(profilesToDisplay.map(p => [p.unique_key, p])).values());

        setSurveillanceProfiles(finalUniqueProfiles);

      } catch (error) {
        console.error("DashboardThree fetch/process error:", error);
        setSurveillanceProfiles([]); // Clear profiles on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchAndProcessProfiles();
    const interval = setInterval(fetchAndProcessProfiles, 10000); 
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-4 md:p-6 lg:p-8 bg-gray-100 min-h-screen">
      <header className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800">The Watcher</h1>
        <p className="text-md text-gray-600 mt-1">Comprehensive Device Tracking System</p>
      </header>

      {/* Main content area - only the profiles list */}
      <div className="max-w-4xl mx-auto"> {/* Centering the content */}
        <Card className="shadow-xl rounded-lg">
          <CardHeader className="bg-gray-800 text-white rounded-t-lg">
            <div className="flex items-center text-2xl font-semibold">
              <Eye className="h-7 w-7 mr-3" />
              Active Surveillance Profiles
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading && <p className="p-6 text-gray-500 text-center">Φόρτωση δεδομένων παρακολούθησης...</p>}
            {!isLoading && surveillanceProfiles.length === 0 && (
              <p className="p-6 text-gray-600 text-center">Δεν υπάρχουν ενεργά προφίλ παρακολούθησης για εμφάνιση. Το σύστημα παρακολουθεί...</p>
            )}
            <ul className="divide-y divide-gray-300">
              {surveillanceProfiles.map((profile) => {
                let itemClasses = "p-4 hover:bg-gray-50 transition-colors duration-150";
                if (profile.is_high_concern) itemClasses += " bg-yellow-50 border-l-4 border-yellow-400";
                // Absence profiles already get a red tag, but we can add a border too if desired
                if (profile.profile_type === 'absence' && profile.is_high_concern) { // If absence is also high concern
                    itemClasses += " bg-red-50 border-l-4 border-red-500"; // More prominent red
                } else if (profile.profile_type === 'absence') {
                    itemClasses += " bg-red-50 border-l-4 border-red-400";
                }
                
                return (
                  <li key={profile.unique_key} className={itemClasses}>
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
                          {profile.movement_pattern_1 && <p className="pl-2">🚩 {profile.movement_pattern_1}</p>}
                          {profile.movement_pattern_2 && <p className="pl-2">🕒 {profile.movement_pattern_2}</p>}
                          {profile.movement_pattern_3 && <p className="pl-2">📍 {profile.movement_pattern_3}</p>}
                          {profile.movement_pattern_4 && <p className="pl-2">📍 {profile.movement_pattern_4}</p>}

                          {(profile.social_insight_1 || profile.social_insight_2) && 
                            <p className="font-semibold text-gray-600 mt-2">Social Insights:</p>
                          }
                          {profile.social_insight_1 && <p className="pl-2">🏅 {profile.social_insight_1}</p>}
                          {profile.social_insight_2 && <p className="pl-2">🔍 {profile.social_insight_2}</p>}
                        </>
                      )}
                      {/* For absence, provocative_note is the main message. For others, it's an additional note. */}
                      {profile.provocative_note && (
                        <p className={`mt-2 ${profile.profile_type === 'absence' ? 'font-semibold text-red-700' : (profile.is_high_concern ? 'italic text-yellow-700 font-medium' : 'italic text-purple-700')}`}>
                          {profile.profile_type === 'absence' ? `⚠️ ${profile.provocative_note}` : profile.provocative_note}
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      </div>

      <footer className="mt-10 py-4 px-6 bg-red-200 border-t-2 border-red-500 rounded-md shadow max-w-4xl mx-auto">
        <p className="text-center text-sm font-semibold text-red-800">
          <AlertTriangle className="inline h-5 w-5 mr-1" />
          WARNING: This is a simulated surveillance demonstration. No actual persistent tracking or cross-session data linkage occurs.
        </p>
      </footer>
    </div>
  );
}