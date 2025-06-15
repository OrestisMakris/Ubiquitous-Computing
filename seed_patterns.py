# ... (other imports and existing templates like BUILDINGS, DEVICE_BRANDS, GREEK_NAMES, MOVEMENT_TEMPLATES, COLOCATION_TEMPLATES, DEVICE_JABS, CLASS_TIMES) ...
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
SOCIAL_TEMPLATES = [ # For 'cooccur'
    "Clubs: Debate Team",
    "Clubs: Gaming Club, Study Group",
    "Clubs: Drama Society",
    "Behavioral Note: Prioritizing fun over exam prep?",
    "Behavioral Note: Potential work-life balance struggles",
    "Behavioral Note: Close social collaboration detected"
]
COLOCATION_TEMPLATES = [ # For 'cooccur'
    "Frequently co-located with {other_device} in {location}",
    "Often seen with {other_device} near {location}",
    "Regularly pairs up with {other_device} in {location}"
]
DEVICE_JABS = [ # For 'cooccur'
    "We rarely see '{name}' around here—mystery device!",
    "'{name}' must be skipping all lectures…",
    "Last week, '{name}' camped out in the Cafeteria for hours.",
    "Are they living in Lab D2? '{name}' shows up every afternoon.",
    "Funny: '{name}' vanishes during exam weeks.",
    "‘{name}’ clocks more hours in the Library than students do.",
]
CLASS_TIMES = [ # For 'routine'
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
    
    # Seed for a good number of pseudonyms to allow variety if DB is sparse
    # If DB has many, sample from them.
    if len(all_pseuds_from_db) < 50: # Ensure a minimum pool if DB is new/empty
        base_pseuds = all_pseuds_from_db
        needed_dummies = 50 - len(all_pseuds_from_db)
        dummy_pseuds = [f"dummy_pseud_seed_{i}" for i in range(needed_dummies)]
        all_pseuds_from_db.extend(dummy_pseuds)

    all_pseuds = random.sample(all_pseuds_from_db, min(len(all_pseuds_from_db), 200)) 

    now = datetime.now().replace(microsecond=0)
    to_upsert = []

    behavioral_notes_templates = [s for s in SOCIAL_TEMPLATES if "Behavioral Note:" in s]
    club_templates = [s for s in SOCIAL_TEMPLATES if "Clubs:" in s]
    other_social_templates = [s for s in SOCIAL_TEMPLATES if not ("Behavioral Note:" in s or "Clubs:" in s)]


    for p_idx, p in enumerate(all_pseuds):
        fake_name = f"{random.choice(DEVICE_BRANDS)}_{random.choice(GREEK_NAMES)}"

        # Generate 2-3 movement patterns (type='last_seen') for synthetic movement descriptions
        for m_template in random.sample(MOVEMENT_TEMPLATES, random.randint(2, 3)):
            to_upsert.append((p, fake_name, 'last_seen', m_template, now))

        # --- Social Insights (type='cooccur') ---
        current_social_insights_for_profile = []

        # 1. Ensure at least one "Clubs:" or other non-behavioral social template
        if club_templates or other_social_templates:
            # Prefer club notes if available
            chosen_base_social = random.choice(club_templates) if club_templates else random.choice(other_social_templates)
            current_social_insights_for_profile.append(chosen_base_social)
        
        # 2. 40% chance for a "Behavioral Note:"
        if behavioral_notes_templates and random.random() < 0.4:
            chosen_behavioral = random.choice(behavioral_notes_templates)
            if chosen_behavioral not in current_social_insights_for_profile: # Avoid duplicate if base was also behavioral
                 current_social_insights_for_profile.append(chosen_behavioral)
        
        # 3. Fill up to have 1 or 2 distinct SOCIAL_TEMPLATES items if possible
        # (This count is for SOCIAL_TEMPLATES only, co-location and jabs are separate)
        num_distinct_social_desired = random.randint(1, 2)
        while len(current_social_insights_for_profile) < num_distinct_social_desired and SOCIAL_TEMPLATES:
            potential_add = random.choice(SOCIAL_TEMPLATES)
            if potential_add not in current_social_insights_for_profile:
                current_social_insights_for_profile.append(potential_add)
            # Break if we can't find more unique ones easily to prevent infinite loop on small template sets
            if len(current_social_insights_for_profile) >= len(SOCIAL_TEMPLATES): 
                break
        
        for s_template in current_social_insights_for_profile:
            to_upsert.append((p, fake_name, 'cooccur', s_template, now))
        
        # Generate 1-2 co-location messages (type='cooccur')
        for _ in range(random.randint(1, 2)):
            other_device_name = f"{random.choice(DEVICE_BRANDS)}_{random.choice(GREEK_NAMES)}"
            location = random.choice(BUILDINGS)
            coloc_msg = random.choice(COLOCATION_TEMPLATES).format(other_device=other_device_name, location=location)
            to_upsert.append((p, fake_name, 'cooccur', coloc_msg, now))

        # 30% chance to add a DEVICE_JABS (type='cooccur')
        if DEVICE_JABS and random.random() < 0.3:
            jab = random.choice(DEVICE_JABS).format(name=fake_name)
            to_upsert.append((p, fake_name, 'cooccur', jab, now))

        # Generate 1-2 routine messages (type='routine')
        for _ in range(random.randint(1, 2)):
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