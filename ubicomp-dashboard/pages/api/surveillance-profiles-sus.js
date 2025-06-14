import { pool } from '@/lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { visibleDeviceNames } = req.body;

  if (!Array.isArray(visibleDeviceNames)) {
    return res.status(400).json({ message: 'visibleDeviceNames must be an array' });
  }

  try {
    const [allFakeProfiles] = await pool.query('SELECT * FROM fake_device_profiles ORDER BY id');
    const profilesToDisplay = [];
    const processedDeviceNames = new Set(); // To ensure each visible device gets one profile at most

    // 1. Match visible devices to 'active' or pattern-based profiles
    for (const deviceName of visibleDeviceNames) {
      let bestMatch = allFakeProfiles.find(p => p.device_name_trigger === deviceName && p.profile_type === 'active');

      if (!bestMatch) {
        const patternProfile = allFakeProfiles.find(p =>
          p.profile_type === 'active' &&
          p.device_name_trigger &&
          p.device_name_trigger.endsWith('%') &&
          deviceName.toLowerCase().startsWith(p.device_name_trigger.slice(0, -1).toLowerCase())
        );
        if (patternProfile) {
          bestMatch = { ...patternProfile, display_device_name: deviceName, original_trigger: patternProfile.device_name_trigger };
        }
      }

      if (bestMatch) {
        profilesToDisplay.push(bestMatch);
        processedDeviceNames.add(deviceName);
      }
    }

    // 2. For remaining visible devices without a specific match, assign a 'generic' profile
    const genericProfileTemplate = allFakeProfiles.find(p => p.profile_type === 'generic');
    for (const deviceName of visibleDeviceNames) {
      if (!processedDeviceNames.has(deviceName) && genericProfileTemplate) {
        profilesToDisplay.push({ ...genericProfileTemplate, display_device_name: deviceName });
        processedDeviceNames.add(deviceName); // Though already covered, good practice
      }
    }

    // 3. Add 'absence' profiles for devices NOT in visibleDeviceNames but defined in fake_device_profiles
    const absenceProfileTemplates = allFakeProfiles.filter(p => p.profile_type === 'absence');
    for (const template of absenceProfileTemplates) {
      // device_name_trigger for absence profiles is the specific name we're looking for
      if (template.device_name_trigger && !visibleDeviceNames.includes(template.device_name_trigger)) {
        // Personalize the provocative note for absence
        const note = template.provocative_note.replace(/'([^']*)'|\b(DeviceName)\b/g, `'${template.display_device_name}'`);
        profilesToDisplay.push({ ...template, provocative_note_final: note });
      }
    }
    
    // Simple deduplication based on display_device_name for active/generic, and profile_name for absence
    const finalProfiles = [];
    const seenDisplayNames = new Set();
    const seenAbsenceProfileNames = new Set();

    for (const p of profilesToDisplay) {
        if (p.profile_type === 'absence') {
            if (!seenAbsenceProfileNames.has(p.profile_name)) {
                finalProfiles.push(p);
                seenAbsenceProfileNames.add(p.profile_name);
            }
        } else { // active or generic
            if (!seenDisplayNames.has(p.display_device_name)) {
                finalProfiles.push(p);
                seenDisplayNames.add(p.display_device_name);
            }
        }
    }


    res.status(200).json({ profiles: finalProfiles });
  } catch (error) {
    console.error('Error fetching surveillance profiles:', error);
    res.status(500).json({ message: 'Internal Server Error', details: error.message });
  }
}