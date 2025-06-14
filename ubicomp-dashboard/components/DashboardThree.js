import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Eye, AlertTriangle, Users, MapPin, Clock, Award, Search } from 'lucide-react';

export default function DashboardThree() {
  const [surveillanceProfiles, setSurveillanceProfiles] = useState([]);
  const [coLocationData, setCoLocationData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAndProcessData = async () => {
      setIsLoading(true);
      try {
        // 1. Fetch visible devices from database
        const visibleDevicesRes = await fetch('/api/visible-devices');
        if (!visibleDevicesRes.ok) throw new Error(`Failed to fetch visible devices: ${visibleDevicesRes.statusText}`);
        const visibleDevicesData = await visibleDevicesRes.json();
        const allVisibleDevices = Array.isArray(visibleDevicesData.devices) ? visibleDevicesData.devices : [];

        // 2. Filter for phones only and extract real names
        const confirmedPhones = allVisibleDevices.filter(
          d => d.major_class && d.major_class.toLowerCase() === 'phone'
        );
        const phoneNames = confirmedPhones.map(phone => phone.name);

        // 3. Fetch surveillance profiles from database
        const profilesRes = await fetch('/api/surveillance-profiles-sus', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ visibleDeviceNames: phoneNames }),
        });
        if (!profilesRes.ok) throw new Error(`Failed to fetch surveillance profiles: ${profilesRes.statusText}`);
        const profilesData = await profilesRes.json();
        let dbProfiles = Array.isArray(profilesData.profiles) ? profilesData.profiles : [];

        // 4. Enhance real phone profiles with isNew flag
        dbProfiles = dbProfiles.map(profile => {
          const correspondingPhone = confirmedPhones.find(phone => 
            phone.name === profile.display_device_name || phone.name === profile.device_name_trigger
          );
          if (correspondingPhone) {
            return { ...profile, isNewActualDevice: correspondingPhone.isNew };
          }
          return profile;
        });

        // 5. Sort profiles - absence first, then high concern, then real phones
        dbProfiles.sort((a, b) => {
          if (a.profile_type === 'absence' && b.profile_type !== 'absence') return -1;
          if (b.profile_type === 'absence' && a.profile_type !== 'absence') return 1;
          if (a.is_high_concern && !b.is_high_concern) return -1;
          if (b.is_high_concern && !a.is_high_concern) return 1;
          return (a.display_device_name || a.profile_name).localeCompare(b.display_device_name || b.profile_name);
        });

        setSurveillanceProfiles(dbProfiles.slice(0, 8)); // Show max 8 profiles

        // 6. Generate synthetic co-location data from active devices
        const activeDeviceNames = dbProfiles
          .filter(p => p.profile_type !== 'absence' && p.display_device_name)
          .map(p => p.display_device_name);

        const newCoLocationData = [];
        if (activeDeviceNames.length >= 2) {
          const usedPairs = new Set();
          const numPairs = Math.min(3, Math.floor(activeDeviceNames.length / 1.5));
          
          for (let i = 0; i < numPairs; i++) {
            let name1Index = Math.floor(Math.random() * activeDeviceNames.length);
            let name2Index = Math.floor(Math.random() * activeDeviceNames.length);
            while (name2Index === name1Index && activeDeviceNames.length > 1) { 
              name2Index = Math.floor(Math.random() * activeDeviceNames.length);
            }
            const pairKey = [activeDeviceNames[name1Index], activeDeviceNames[name2Index]].sort().join('+');
            if (activeDeviceNames[name1Index] !== activeDeviceNames[name2Index] && !usedPairs.has(pairKey)) {
              newCoLocationData.push({
                pair: `${activeDeviceNames[name1Index]} + ${activeDeviceNames[name2Index]}`,
                frequency: `${Math.floor(Math.random() * 40) + 60}%` // 60-99%
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

  const DetailItem = ({ icon: IconComponent, text, iconColor = "text-blue-500" }) => {
    if (!text) return null;
    return (
      <div className="flex items-start space-x-2 mb-1">
        <IconComponent className={`h-4 w-4 ${iconColor} mt-0.5 flex-shrink-0`} />
        <span className="text-sm text-gray-700 leading-relaxed">{text}</span>
      </div>
    );
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <header className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">The Watcher</h1>
        <p className="text-lg text-gray-600">Comprehensive Device Tracking System</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Surveillance Feed - Takes 3 columns */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gray-100 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center">
                <Eye className="h-6 w-6 mr-3 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-800">Active Surveillance Profiles</h2>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-6">
              {isLoading && (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">🔄 Φόρτωση δεδομένων επιτήρησης...</p>
                </div>
              )}
              
              {!isLoading && surveillanceProfiles.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-600 text-lg">📵 Δεν υπάρχουν ενεργά προφίλ παρακολούθησης.</p>
                </div>
              )}
              
              {/* Profile Cards Grid */}
              <div className="space-y-4">
                {!isLoading && surveillanceProfiles.map((profile) => (
                  <div key={profile.id || profile.profile_name} className="bg-gray-50 rounded-lg p-5 border-l-4 border-blue-500 hover:shadow-md transition-shadow">
                    {/* Profile Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-blue-700 mb-1 flex items-center">
                          {profile.display_device_name}
                          {profile.isNewActualDevice && (
                            <span className="ml-2 px-2 py-1 bg-red-100 text-red-600 rounded text-xs font-bold">
                              Νέα!
                            </span>
                          )}
                        </h3>
                        {profile.profile_type === 'absence' && (
                          <p className="text-sm text-red-600 font-medium">⚠️ ABSENCE</p>
                        )}
                        {profile.profile_type === 'active' && (
                          <p className="text-sm text-green-600 font-medium">🔍 ACTIVE TRACKING</p>
                        )}
                      </div>
                      {(profile.is_high_concern || profile.profile_type === 'absence') && (
                        <AlertTriangle className={`h-6 w-6 flex-shrink-0 ${
                          profile.profile_type === 'absence' ? 'text-red-500' : 'text-yellow-500'
                        }`} />
                      )}
                    </div>

                    {/* Profile Content - Only show for non-absence profiles */}
                    {profile.profile_type !== 'absence' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Movement Patterns */}
                        <div>
                          <h4 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">
                            Movement Patterns
                          </h4>
                          <div className="space-y-1">
                            <DetailItem 
                              icon={MapPin} 
                              text={profile.movement_pattern_1} 
                              iconColor="text-red-500" 
                            />
                            <DetailItem 
                              icon={Clock} 
                              text={profile.movement_pattern_2} 
                              iconColor="text-blue-500" 
                            />
                            <DetailItem 
                              icon={MapPin} 
                              text={profile.movement_pattern_3} 
                              iconColor="text-green-500" 
                            />
                            <DetailItem 
                              icon={MapPin} 
                              text={profile.movement_pattern_4} 
                              iconColor="text-purple-500" 
                            />
                          </div>
                        </div>

                        {/* Social Insights */}
                        <div>
                          <h4 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">
                            Social Insights
                          </h4>
                          <div className="space-y-1">
                            <DetailItem 
                              icon={Award} 
                              text={profile.social_insight_1} 
                              iconColor="text-yellow-500" 
                            />
                            <DetailItem 
                              icon={Search} 
                              text={profile.social_insight_2} 
                              iconColor="text-indigo-500" 
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Provocative Note */}
                    {profile.provocative_note && (
                      <div className="mt-4 pt-4 border-t border-gray-300">
                        <p className={`text-sm font-medium ${
                          profile.profile_type === 'absence' ? 'text-red-700' :
                          profile.is_high_concern ? 'text-yellow-700' :
                          'text-green-700'
                        }`}>
                          {profile.profile_type === 'absence' 
                            ? (profile.provocative_note_final || profile.provocative_note)
                            : profile.provocative_note
                          }
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Takes 1 column */}
        <div className="space-y-6">
          {/* Co-location Frequency */}
          <Card className="bg-white shadow-lg">
            <CardHeader className="pb-3 pt-4 px-5 bg-purple-50 border-b border-purple-100">
              <CardTitle className="text-lg font-semibold text-gray-700 flex items-center">
                <Users className="h-5 w-5 mr-2 text-purple-600" />
                Co-location Frequency
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              {isLoading && <p className="text-sm text-gray-500">🔄 Loading...</p>}
              {!isLoading && coLocationData.length === 0 && (
                <p className="text-sm text-gray-500">📵 No co-location data available.</p>
              )}
              {coLocationData.map((item, index) => (
                <div key={index}>
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-sm font-medium text-gray-700 truncate">{item.pair}</p>
                    <span className="text-sm font-bold text-purple-600">{item.frequency}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-500 h-full rounded-full transition-all duration-300" 
                      style={{ width: item.frequency }}
                    ></div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Behavioral Predictions */}
          <Card className="bg-white shadow-lg">
            <CardHeader className="pb-3 pt-4 px-5 bg-orange-50 border-b border-orange-100">
              <CardTitle className="text-lg font-semibold text-gray-700 flex items-center">
                <Search className="h-5 w-5 mr-2 text-orange-600" />
                Behavioral Predictions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-orange-500" />
                <span className="text-sm text-gray-600">🎯 Predict next likely location</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-orange-500" />
                <span className="text-sm text-gray-600">⏰ Estimate arrival times</span>
              </div>
              <div className="flex items-center space-x-2">
                <Award className="h-4 w-4 text-orange-500" />
                <span className="text-sm text-gray-600">📊 Correlation with academic performance</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Warning Footer */}
      <footer className="mt-10 py-4 px-6 bg-red-100 border border-red-300 rounded-lg shadow-md">
        <p className="text-center text-sm font-medium text-red-700">
          <AlertTriangle className="inline h-5 w-5 mr-2" />
          ⚠️ WARNING: This is a simulated surveillance demonstration. No actual persistent tracking or cross-session data linkage occurs.
        </p>
      </footer>
    </div>
  );
}