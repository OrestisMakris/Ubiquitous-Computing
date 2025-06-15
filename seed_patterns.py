import mysql.connector
import random
from datetime import datetime

# --- Config ---
DB_CONF = dict(
    host="127.0.0.1", user="root", password="tsitsitsitsi", database="dashboard"
)

BUILDINGS = [
    "Amphitheater C", "Amphitheater E1", "Amphitheater E2",
    "Lab D1", "Lab D2", "Building B", "Library", "Cafeteria", "Academic Zone", "Courtyard",
    "Student Hub", "Research Center", "Sports Complex", "Administration Building"
]
DEVICE_BRANDS = ["iPhone","Samsung","HTC","Pixel","OnePlus","Airpods", "MacBook", "Lenovo", "Asus", "Dell"]
GREEK_NAMES = [
    "Γιώργος","Μαρία","Αλέξανδρος","Ελένη","Δημήτρης",
    "Κατερίνα","Νίκος","Άννα","Σπύρος","Χριστίνα"
]

# --- Template Definitions ---

# For pattern_type = 'last_seen' (Movement Patterns for Fakes)
BASE_MOVEMENT_TEMPLATES = [
    "sporadic library visits",
    "inconsistent campus presence",
    "often seen near the {building}", # New template using building
    "frequently in {building} during midday", # New template
    "usually in {building} after 6 PM",
    "morning: {building}",
    "afternoon: {building}",
    "evening: {building}", # New
    "late night activity near {building}", # New
    "brief appearances in {building}", # New
]

# For pattern_type = 'cooccur' (Social Insights)
SOCIAL_TEMPLATES = [
    "Clubs: Debate Team",
    "Clubs: Gaming Club, Study Group",
    "Clubs: Drama Society",
    "Clubs: Photography Club", # New
    "Clubs: Coding Circle", # New
    "Behavioral Note: Prioritizing fun over exam prep?",
    "Behavioral Note: Potential work-life balance struggles",
    "Behavioral Note: Close social collaboration detected",
    "Behavioral Note: Appears highly focused on studies", # New
    "Behavioral Note: Often isolated, prefers solo work", # New
]
COLOCATION_TEMPLATES = [
    "Frequently co-located with {other_device} in {location}",
    "Often seen with {other_device} near {location}",
    "Regularly pairs up with {other_device} in {location}",
    "Spotted chatting with {other_device} at {location}", # New
]
DEVICE_JABS = [
    "We rarely see '{name}' around here—mystery device!",
    "'{name}' must be skipping all lectures…",
    "Last week, '{name}' camped out in the Cafeteria for hours.",
    "Are they living in Lab D2? '{name}' shows up every afternoon.",
    "Funny: '{name}' vanishes during exam weeks.",
    "‘{name}’ clocks more hours in the Library than students do.",
    "'{name}' seems to only appear for the free coffee.", # New
]

# For pattern_type = 'routine' (Social Insights - Routines)
CLASS_TIMES_ACTIVITIES = [
    "after the 9 AM lecture series", # More specific times
    "during the 11 AM workshop",
    "right before the 1 PM lab session",
    "around the 3 PM seminar",
    "attending the 5 PM guest speaker event",
    "for the 8 AM early bird study group", # More activities
    "at the 12 PM lunch rush",
    "during the 2 PM project meeting",
    "for the 4 PM society meetup",
    "late evening study session until 10 PM",
]

def random_time_str():
    hour = random.randint(8, 22) # Campus hours
    minute = random.choice([0, 15, 30, 45]) # More realistic minutes
    return f"{hour:02d}:{minute:02d}"

def seed_synthetic():
    db = mysql.connector.connect(**DB_CONF)
    cur = db.cursor(dictionary=True)
    cur.execute("TRUNCATE TABLE synthetic_patterns")

    cur.execute("SELECT DISTINCT pseudonym FROM device_sessions")
    all_pseuds_from_db = [r['pseudonym'] for r in cur.fetchall()]
    
    if len(all_pseuds_from_db) < 50:
        needed_dummies = 50 - len(all_pseuds_from_db)
        dummy_pseuds = [f"dummy_pseud_seed_{i}" for i in range(needed_dummies)]
        all_pseuds_from_db.extend(dummy_pseuds)

    all_pseuds = random.sample(all_pseuds_from_db, min(len(all_pseuds_from_db), 200)) 

    now = datetime.now().replace(microsecond=0)
    to_upsert = []

    club_templates = [s for s in SOCIAL_TEMPLATES if s.startswith("Clubs:")]
    behavioral_notes_templates = [s for s in SOCIAL_TEMPLATES if s.startswith("Behavioral Note:")]

    for p_idx, p in enumerate(all_pseuds):
        fake_name = f"{random.choice(DEVICE_BRANDS)}_{random.choice(GREEK_NAMES)}"

        # 1. Synthetic Movement Patterns (type='last_seen')
        #    One specific "Last spotted at..." message for fake devices.
        #    Plus 1-2 other general movement descriptions.
        current_movement_patterns = set()
        
        # Add the specific "Last spotted at..." for fake devices
        last_spot_building = random.choice(BUILDINGS)
        last_spot_time = random_time_str()
        current_movement_patterns.add(f"Last spotted at {last_spot_building} around {last_spot_time}")

        # Add 1 or 2 more general movement templates, formatted with a building
        num_additional_movements = random.randint(1, 2)
        possible_movement_choices = [
            template.format(building=random.choice(BUILDINGS)) for template in BASE_MOVEMENT_TEMPLATES
        ]
        if len(possible_movement_choices) >= num_additional_movements :
            additional_movements = random.sample(possible_movement_choices, num_additional_movements)
            for m in additional_movements:
                current_movement_patterns.add(m)
        
        for movement_msg in list(current_movement_patterns):
            to_upsert.append((p, fake_name, 'last_seen', movement_msg, now))

        # 2. Social Insights from SOCIAL_TEMPLATES (type='cooccur')
        selected_social_items_for_profile = set()

        if club_templates: # Prioritize adding a club
            selected_social_items_for_profile.add(random.choice(club_templates))

        if behavioral_notes_templates and random.random() < 0.4: # 40% for behavioral
            selected_social_items_for_profile.add(random.choice(behavioral_notes_templates))
        
        # Ensure at least 1, and aim for up to 2 distinct items from SOCIAL_TEMPLATES
        # If still empty and SOCIAL_TEMPLATES has items, add one.
        if not selected_social_items_for_profile and SOCIAL_TEMPLATES:
             selected_social_items_for_profile.add(random.choice(SOCIAL_TEMPLATES))
        
        # Try to fill to 2 if less and templates are available
        fill_attempts = 0
        while SOCIAL_TEMPLATES and len(selected_social_items_for_profile) < random.randint(1,2) and fill_attempts < 5 : # Aim for 1 or 2
            item_to_add = random.choice(SOCIAL_TEMPLATES)
            selected_social_items_for_profile.add(item_to_add)
            fill_attempts +=1
            
        for item_text in list(selected_social_items_for_profile):
            to_upsert.append((p, fake_name, 'cooccur', item_text, now))
        
        # 3. Co-location messages (type='cooccur')
        for _ in range(random.randint(1, 2)):
            other_device_name = f"{random.choice(DEVICE_BRANDS)}_{random.choice(GREEK_NAMES)}"
            location = random.choice(BUILDINGS)
            coloc_msg = random.choice(COLOCATION_TEMPLATES).format(other_device=other_device_name, location=location)
            to_upsert.append((p, fake_name, 'cooccur', coloc_msg, now))

        # 4. Device Jabs (type='cooccur')
        if DEVICE_JABS and random.random() < 0.3:
            jab = random.choice(DEVICE_JABS).format(name=fake_name)
            to_upsert.append((p, fake_name, 'cooccur', jab, now))

        # 5. Routine messages (type='routine')
        for _ in range(random.randint(1, 2)):
            activity_phrase = random.choice(CLASS_TIMES_ACTIVITIES)
            bld = random.choice(BUILDINGS)
            routine_msg = f"Typically active {activity_phrase} in the {bld}."
            to_upsert.append((p, fake_name, 'routine', routine_msg, now))

    sql = """
      INSERT INTO synthetic_patterns
        (pseudonym, device_name, pattern_type, message, created_at)
      VALUES (%s,%s,%s,%s,%s)
      ON DUPLICATE KEY UPDATE
        device_name=VALUES(device_name),
        message=VALUES(message),
        created_at=VALUES(created_at)
    """
    if to_upsert:
        cur.executemany(sql, to_upsert)
        db.commit()
    
    cur.close()
    db.close()
    print(f"Seeded {len(to_upsert)} pattern entries for {len(all_pseuds)} pseudonyms.")

if __name__ == "__main__":
    seed_synthetic()