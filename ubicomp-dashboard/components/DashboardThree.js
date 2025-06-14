import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Eye, AlertTriangle, Target, Users, Brain, MapPin, Clock, Club, Search, Flag } from 'lucide-react'; // Added Flag

// Helper to render pattern if it exists
const DetailItem = ({ icon: Icon, text, iconClassName = "text-gray-500" }) => {
  if (!text) { // If text is falsy (null, undefined, empty string)
    return null; // Render nothing
  }
  // If text exists, render the item
  return (
    <div className="flex items-start text-sm text-gray-600 mb-1">
      <Icon className={`h-4 w-4 mr-2 mt-0.5 flex-shrink-0 ${iconClassName}`} />
      <span>{text}</span>
    </div>
  );
};

export default function DashboardThree() {
  const [surveillanceProfiles, setSurveillanceProfiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfiles = async () => {
      setIsLoading(true);
      try {
        const visibleDevicesRes = await fetch('/api/visible-devices');
        if (!visibleDevicesRes.ok) throw new Error('Failed to fetch visible devices');
        const visibleDevicesData = await visibleDevicesRes.json();
        const visibleDeviceNames = Array.isArray(visibleDevicesData.devices)
          ? visibleDevicesData.devices.map(d => d.name)
          : [];

        const profilesRes = await fetch('/api/surveillance-profiles-sus', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ visibleDeviceNames }),
        });
        if (!profilesRes.ok) throw new Error('Failed to fetch surveillance profiles');
        const profilesData = await profilesRes.json();
        setSurveillanceProfiles(Array.isArray(profilesData.profiles) ? profilesData.profiles : []);
      } catch (error) {
        console.error("DashboardThree fetch error:", error);
        setSurveillanceProfiles([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfiles();
    const interval = setInterval(fetchProfiles, 15000); // Refresh every 15 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-4 md:p-6 lg:p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <header className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800">The Watcher</h1>
        <p className="text-md text-gray-600 mt-1">Comprehensive Device Tracking System</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Active Surveillance Profiles */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center text-2xl font-semibold text-gray-700 mb-1">
            <Eye className="h-7 w-7 mr-2 text-blue-600" />
            Active Surveillance Profiles
          </div>
          {isLoading && <p className="text-gray-500">Loading surveillance data...</p>}
          {!isLoading && surveillanceProfiles.length === 0 && (
            <p className="text-gray-500">No surveillance profiles to display currently. The system is watching...</p>
          )}
          {surveillanceProfiles.map((profile) => {
            let cardBaseClasses = "shadow-lg rounded-lg overflow-hidden transition-all duration-300 ease-in-out";
            let cardHeaderClasses = "pb-3 pt-4 px-4 border-b";
            let cardTitleClasses = "text-xl font-bold";
            let concernIcon = null;
            let detailIconClass = "text-gray-500";

            if (profile.is_high_concern) {
              cardBaseClasses += " bg-yellow-50 border-2 border-yellow-400 ring-2 ring-yellow-200";
              cardHeaderClasses += " bg-yellow-100 border-yellow-300";
              cardTitleClasses += " text-yellow-800";
              concernIcon = <AlertTriangle className="h-6 w-6 text-yellow-600" />;
              detailIconClass = "text-yellow-700";
            } else if (profile.profile_type === 'absence') {
              cardBaseClasses += " bg-red-50 border-2 border-red-400";
              cardHeaderClasses += " bg-red-100 border-red-300";
              cardTitleClasses += " text-red-800";
              concernIcon = <AlertTriangle className="h-6 w-6 text-red-600" />; 
              detailIconClass = "text-red-700";
            } else if (profile.profile_type === 'generic') {
              cardBaseClasses += " bg-gray-100 border border-gray-300";
              cardHeaderClasses += " bg-gray-200 border-gray-300";
              cardTitleClasses += " text-gray-700";
              detailIconClass = "text-gray-600";
            } else { // Active, not high concern
              cardBaseClasses += " bg-white border border-gray-200";
              cardHeaderClasses += " bg-gray-50 border-gray-200";
              cardTitleClasses += " text-blue-700";
            }

            return (
              <Card key={profile.id || profile.profile_name} className={cardBaseClasses}>
                <CardHeader className={cardHeaderClasses}>
                  <div className="flex justify-between items-center">
                    <CardTitle className={cardTitleClasses}>{profile.display_device_name}</CardTitle>
                    {concernIcon}
                  </div>
                </CardHeader>
                <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-1 text-sm">Movement Patterns:</h4>
                    {profile.profile_type === 'absence' ? (
                       <DetailItem icon={AlertTriangle} text={profile.provocative_note_final || profile.provocative_note} iconClassName={detailIconClass} />
                    ) : (
                      <>
                        {/* Explicitly setting icons for each movement pattern */}
                        <DetailItem icon={Flag} text={profile.movement_pattern_1} iconClassName={detailIconClass} />
                        <DetailItem icon={Clock} text={profile.movement_pattern_2} iconClassName={detailIconClass} />
                        <DetailItem icon={MapPin} text={profile.movement_pattern_3} iconClassName={detailIconClass} />
                        <DetailItem icon={MapPin} text={profile.movement_pattern_4} iconClassName={detailIconClass} />
                      </>
                    )}
                  </div>
                  {profile.profile_type !== 'absence' && (
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-1 text-sm">Social Insights:</h4>
                      {/* Explicitly setting icons for each social insight */}
                      <DetailItem icon={Club} text={profile.social_insight_1} iconClassName={detailIconClass} />
                      <DetailItem icon={Search} text={profile.social_insight_2} iconClassName={detailIconClass} />
                       {profile.provocative_note && profile.profile_type === 'active' && ( 
                          <DetailItem icon={AlertTriangle} text={profile.provocative_note} iconClassName={profile.is_high_concern ? "text-yellow-700" : "text-orange-600"} />
                       )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Right Column: Info Panels (Static as per design) */}
        <div className="space-y-6 lg:pt-10">
          {/* Tracking Intensity */}
          <Card className="bg-white shadow-md">
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

          {/* Co-location Frequency */}
          <Card className="bg-white shadow-md">
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

          {/* Behavioral Predictions */}
          <Card className="bg-white shadow-md">
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

      {/* Warning Banner */}
      <footer className="mt-10 py-4 px-6 bg-red-100 border-t-2 border-red-500 rounded-md">
        <p className="text-center text-sm font-semibold text-red-700">
          <AlertTriangle className="inline h-5 w-5 mr-1" />
          WARNING: This is a simulated surveillance demonstration. No actual persistent tracking or cross-session data linkage occurs.
        </p>
      </footer>
    </div>
  );
}