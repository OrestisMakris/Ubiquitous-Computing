import mysql.connector
import random
from datetime import datetime

# --- Config ---
DB_CONF = dict(
    host="127.0.0.1", user="root", password="tsitsitsitsi", database="dashboard"
)

BUILDINGS = [
    "Amphitheater C", "Amphitheater E1", "Amphitheater E2",
    "Lab D1", "Lab D2", "Building B", "Library", "Cafeteria", "Academic Zone", "Courtyard"
]
DEVICE_BRANDS = ["iPhone","Samsung","HTC","Pixel","OnePlus","Airpods", "MacBook", "Lenovo", "Asus", "Dell"]
GREEK_NAMES = [
    "Γιώργος","Μαρία","Αλέξανδρος","Ελένη","Δημήτρης",
    "Κατερίνα","Νίκος","Άννα","Σπύρος","Χριστίνα"
]

MOVEMENT_TEMPLATES = [
    "sporadic library visits",
    "inconsistent campus presence",
    "passes scanner B daily at 8:30 AM",
    "frequently in Cafeteria",
    "usually in Lab D1 after 6 PM",
    "morning: Academic Zone",
    "afternoon: Courtyard"
]

# Ensure this list is correctly defined in your file
SOCIAL_TEMPLATES = [ # For 'cooccur' pattern_type
    "Clubs: Debate Team",
    "Clubs: Gaming Club, Study Group", # Corrected "ClubBehaviorals" to "Clubs"
    "Clubs: Drama Society",
    "Behavioral Note: Prioritizing fun over exam prep?",
    "Behavioral Note: Potential work-life balance struggles",
    "Behavioral Note: Close social collaboration detected"
]

COLOCATION_TEMPLATES = [ # For 'cooccur' pattern_type
    "Frequently co-located with {other_device} in {location}",
    "Often seen with {other_device} near {location}",
    "Regularly pairs up with {other_device} in {location}"
]
DEVICE_JABS = [ # For 'cooccur' pattern_type
    "We rarely see '{name}' around here—mystery device!",
    "'{name}' must be skipping all lectures…",
    "Last week, '{name}' camped out in the Cafeteria for hours.",
    "Are they living in Lab D2? '{name}' shows up every afternoon.",
    "Funny: '{name}' vanishes during exam weeks.",
    "‘{name}’ clocks more hours in the Library than students do.",
]
CLASS_TIMES = [ # For 'routine' pattern_type
    "after the 10 AM lecture",
    "during the 2 PM seminar",
    "right before the 8 AM lab",
    "around the 5 PM workshop"
]

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

    # Pre-filter SOCIAL_TEMPLATES for easier selection
    club_templates = [s for s in SOCIAL_TEMPLATES if s.startswith("Clubs:")]
    behavioral_notes_templates = [s for s in SOCIAL_TEMPLATES if s.startswith("Behavioral Note:")]
    # Other general social templates (if any, not used in current SOCIAL_TEMPLATES example)
    # other_specific_social = [s for s in SOCIAL_TEMPLATES if not (s.startswith("Clubs:") or s.startswith("Behavioral Note:"))]

    for p_idx, p in enumerate(all_pseuds):
        fake_name = f"{random.choice(DEVICE_BRANDS)}_{random.choice(GREEK_NAMES)}"

        # 1. Synthetic Movement Patterns (type='last_seen')
        #    Each fake device gets 2-3 descriptive movement lines.
        #    Real devices will have their actual "Last Seen: <timestamp>" prepended to these by the frontend.
        for m_template in random.sample(MOVEMENT_TEMPLATES, random.randint(2, 3)):
            to_upsert.append((p, fake_name, 'last_seen', m_template, now))

        # 2. Social Insights from SOCIAL_TEMPLATES (type='cooccur')
        selected_social_items_for_profile = set() # Use a set to ensure uniqueness

        # Try to add one "Clubs:" template
        if club_templates:
            selected_social_items_for_profile.add(random.choice(club_templates))

        # 40% chance to add one "Behavioral Note:" template
        if behavioral_notes_templates and random.random() < 0.4:
            selected_social_items_for_profile.add(random.choice(behavioral_notes_templates))
        
        # If after the above, we still have 0 or 1 item, and we want to ensure at least 1 (or up to 2)
        # distinct items from SOCIAL_TEMPLATES, try to add more.
        desired_count_from_social_templates = random.randint(1, 2)
        fill_attempts = 0
        # Ensure at least one item if currently none and SOCIAL_TEMPLATES is not empty
        if not selected_social_items_for_profile and SOCIAL_TEMPLATES:
             selected_social_items_for_profile.add(random.choice(SOCIAL_TEMPLATES))

        while len(selected_social_items_for_profile) < desired_count_from_social_templates and SOCIAL_TEMPLATES and fill_attempts < 5:
            item_to_add = random.choice(SOCIAL_TEMPLATES) # Pick from the full list to allow variety
            selected_social_items_for_profile.add(item_to_add) 
            fill_attempts += 1
            
        for item_text in list(selected_social_items_for_profile):
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
            ct = random.choice(CLASS_TIMES)
            bld = random.choice(BUILDINGS)
            routine_msg = f"Typically active {ct} in the {bld}."
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