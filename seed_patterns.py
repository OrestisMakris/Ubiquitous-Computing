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

# For pattern_type = 'last_seen' (Movement Patterns)
# These will be used to generate "Last spotted at..." messages
# BASE_MOVEMENT_TEMPLATES is now less critical as we'll focus on "Last spotted at..."
# but can be used for additional variety if desired.
BASE_MOVEMENT_TEMPLATES = [
    "sporadic library visits",
    "inconsistent campus presence",
    "often seen near the {building}",
    "frequently in {building} during midday",
    "usually in {building} after 6 PM",
    "morning: {building}",
    "afternoon: {building}",
    "evening: {building}",
]

# For pattern_type = 'cooccur' (Social Insights)
SOCIAL_TEMPLATES = [
    "Clubs: Debate Team",
    "Clubs: Gaming Club, Study Group",
    "Clubs: Drama Society",
    "Clubs: Photography Club",
    "Clubs: Coding Circle",
    "Behavioral Note: Prioritizing fun over exam prep?",
    "Behavioral Note: Potential work-life balance struggles",
    "Behavioral Note: Close social collaboration detected",
    "Behavioral Note: Appears highly focused on studies",
    "Behavioral Note: Often isolated, prefers solo work",
]
COLOCATION_TEMPLATES = [
    "Frequently co-located with {other_device} in {location}",
    "Often seen with {other_device} near {location}",
    "Regularly pairs up with {other_device} in {location}",
    "Spotted chatting with {other_device} at {location}",
]
DEVICE_JABS = [
    "We rarely see '{name}' around here—mystery device!",
    "'{name}' must be skipping all lectures…",
    "Last week, '{name}' camped out in the Cafeteria for hours.",
    "Are they living in Lab D2? '{name}' shows up every afternoon.",
    "Funny: '{name}' vanishes during exam weeks.",
    "‘{name}’ clocks more hours in the Library than students do.",
    "'{name}' seems to only appear for the free coffee.",
]

# For pattern_type = 'routine' (Social Insights - Routines)
CLASS_TIMES_ACTIVITIES = [
    "after the 9 AM lecture series",
    "during the 11 AM workshop",
    "right before the 1 PM lab session",
    "around the 3 PM seminar",
    "attending the 5 PM guest speaker event",
    "for the 8 AM early bird study group",
    "at the 12 PM lunch rush",
    "during the 2 PM project meeting",
    "for the 4 PM society meetup",
    "late evening study session until 10 PM",
]

def random_time_str():
    hour = random.randint(8, 22)
    minute = random.choice([0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]) # More minute variety
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
        #    Generate 2-3 "Last spotted at..." messages for ALL devices (real and fake).
        #    Real devices will have their actual timestamp prepended by the frontend.
        num_last_spotted_messages = random.randint(2, 3)
        for _ in range(num_last_spotted_messages):
            spot_building = random.choice(BUILDINGS)
            spot_time = random_time_str()
            movement_msg = f"Last spotted at {spot_building} around {spot_time}"
            to_upsert.append((p, fake_name, 'last_seen', movement_msg, now))
        
        # Optionally, add one more general movement pattern for variety
        if random.random() < 0.5 and BASE_MOVEMENT_TEMPLATES: # 50% chance
            general_movement_template = random.choice(BASE_MOVEMENT_TEMPLATES)
            general_movement_msg = general_movement_template.format(building=random.choice(BUILDINGS))
            to_upsert.append((p, fake_name, 'last_seen', general_movement_msg, now))


        # 2. Social Insights from SOCIAL_TEMPLATES (type='cooccur')
        selected_social_items_for_profile = set() # Use a set to ensure uniqueness

        # Ensure at least one "Clubs:" item if available
        if club_templates:
            selected_social_items_for_profile.add(random.choice(club_templates))

        # 40% chance to add one "Behavioral Note:" item if available
        if behavioral_notes_templates and random.random() < 0.4:
            selected_social_items_for_profile.add(random.choice(behavioral_notes_templates))
        
        # If after the above, the set is empty (e.g., no club templates and behavioral note wasn't picked),
        # AND SOCIAL_TEMPLATES itself is not empty, add one random item from SOCIAL_TEMPLATES.
        if not selected_social_items_for_profile and SOCIAL_TEMPLATES:
             selected_social_items_for_profile.add(random.choice(SOCIAL_TEMPLATES))
            
        for item_text in list(selected_social_items_for_profile): # Convert set to list for iteration
            if item_text: # Ensure item_text is not None or empty
                to_upsert.append((p, fake_name, 'cooccur', item_text, now))
        
        # 3. Co-location messages (type='cooccur')
        for _ in range(random.randint(1, 2)): # 1 to 2 co-location messages
            other_device_name = f"{random.choice(DEVICE_BRANDS)}_{random.choice(GREEK_NAMES)}"
            location = random.choice(BUILDINGS)
            coloc_msg = random.choice(COLOCATION_TEMPLATES).format(other_device=other_device_name, location=location)
            to_upsert.append((p, fake_name, 'cooccur', coloc_msg, now))

        # 4. Device Jabs (type='cooccur')
        if DEVICE_JABS and random.random() < 0.3: # 30% chance for a jab
            jab = random.choice(DEVICE_JABS).format(name=fake_name)
            to_upsert.append((p, fake_name, 'cooccur', jab, now))

        # 5. Routine messages (type='routine')
        for _ in range(random.randint(1, 2)): # 1 to 2 routine messages
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