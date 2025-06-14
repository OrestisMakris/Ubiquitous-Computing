import { pool } from '@/lib/db'; // Assuming your db connection utility

// Helper function to shuffle an array
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]; // Swap elements
  }
  return array;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { visibleDeviceNames } = req.body;

  if (!Array.isArray(visibleDeviceNames)) {
    return res.status(400).json({ message: 'visibleDeviceNames must be an array' });
  }

  try {
    const [allFakeProfilesFromDB] = await pool.query('SELECT * FROM fake_device_profiles WHERE profile_type != "real_phone_synthetic"');
    
    // Shuffle the profiles fetched from DB to introduce randomness
    const shuffledDbProfiles = shuffleArray([...allFakeProfilesFromDB]);

    const profilesToDisplay = [];
    const matchedDeviceNamesForActiveGeneric = new Set();

    // 1. Match visible devices to 'active' profiles (exact or pattern)
    for (const deviceName of visibleDeviceNames) {
      let bestMatch = shuffledDbProfiles.find(p => p.device_name_trigger === deviceName && p.profile_type === 'active');

      if (!bestMatch) {
        const patternProfile = shuffledDbProfiles.find(p =>
          p.profile_type === 'active' &&
          p.device_name_trigger &&
          p.device_name_trigger.endsWith('%') &&
          deviceName.toLowerCase().startsWith(p.device_name_trigger.slice(0, -1).toLowerCase())
        );
        if (patternProfile) {
          // Create a new object for this match to avoid modifying the template and to set display_device_name
          bestMatch = { ...patternProfile, display_device_name: deviceName, id: `${patternProfile.id}-${deviceName}` };
        }
      }

      if (bestMatch && !matchedDeviceNamesForActiveGeneric.has(deviceName)) {
        profilesToDisplay.push(bestMatch);
        matchedDeviceNamesForActiveGeneric.add(deviceName);
      }
    }

    // 2. For remaining visible devices without a specific 'active' match, assign a 'generic' profile if available
    // Ensure a generic profile is only assigned once per unique generic profile_name template
    const genericProfileTemplates = shuffledDbProfiles.filter(p => p.profile_type === 'generic');
    let genericIndex = 0;
    for (const deviceName of visibleDeviceNames) {
      if (!matchedDeviceNamesForActiveGeneric.has(deviceName) && genericProfileTemplates.length > 0) {
        // Cycle through available generic templates or pick one randomly
        const genericTemplateToUse = genericProfileTemplates[genericIndex % genericProfileTemplates.length];
        profilesToDisplay.push({ 
            ...genericTemplateToUse, 
            display_device_name: deviceName, 
            id: `${genericTemplateToUse.id}-${deviceName}` // Ensure unique key for list rendering
        });
        matchedDeviceNamesForActiveGeneric.add(deviceName);
        genericIndex++;
      }
    }
    
    // 3. Add 'absence' profiles for devices NOT in visibleDeviceNames
    const absenceProfileTemplates = shuffledDbProfiles.filter(p => p.profile_type === 'absence');
    for (const template of absenceProfileTemplates) {
      if (template.device_name_trigger && !visibleDeviceNames.includes(template.device_name_trigger)) {
         // Personalize the provocative note for absence
        const note = template.provocative_note.replace(/'([^']*)'|\b(DeviceName)\b/g, (match, g1) => {
            return g1 ? `'${template.display_device_name}'` : `'${template.display_device_name}'`;
        });
        profilesToDisplay.push({ ...template, provocative_note_final: note }); // Use provocative_note_final for clarity
      }
    }
    
    // Deduplicate: Ensure one profile per display_device_name for active/generic, and one per profile_name for absence
    const finalUniqueProfiles = [];
    const seenDisplayNames = new Set(); // For active/generic
    const seenAbsenceProfileNames = new Set(); // For absence

    for (const p of profilesToDisplay) {
        if (p.profile_type === 'absence') {
            if (!seenAbsenceProfileNames.has(p.profile_name)) {
                finalUniqueProfiles.push(p);
                seenAbsenceProfileNames.add(p.profile_name);
            }
        } else { // active or generic
            if (!seenDisplayNames.has(p.display_device_name)) {
                finalUniqueProfiles.push(p);
                seenDisplayNames.add(p.display_device_name);
            }
        }
    }

    // Sort to bring absence and high concern to top, then by ID or name
     finalUniqueProfiles.sort((a, b) => {
        if (a.profile_type === 'absence' && b.profile_type !== 'absence') return -1;
        if (b.profile_type === 'absence' && a.profile_type !== 'absence') return 1;
        if (a.is_high_concern && !b.is_high_concern) return -1;
        if (b.is_high_concern && !a.is_high_concern) return 1;
        return (a.display_device_name || a.profile_name).localeCompare(b.display_device_name || b.profile_name);
    });


    res.status(200).json({ profiles: finalUniqueProfiles });
  } catch (error) {
    console.error('Error fetching surveillance profiles:', error);
    res.status(500).json({ message: 'Internal Server Error', details: error.message });
  }
}