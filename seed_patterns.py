# ... (other imports and existing templates like BUILDINGS, DEVICE_BRANDS, GREEK_NAMES, MOVEMENT_TEMPLATES, SOCIAL_TEMPLATES, DEVICE_JABS, CLASS_TIMES) ...
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
    
    # Ensure we have enough pseudonyms if DB is sparse, or cap if too many
    # For testing, let's ensure we try to seed for at least 20-30 potential profiles
    # if len(all_pseuds_from_db) < 30:
    #     # Add some dummy pseudonyms if DB doesn't have many, for robust seeding
    #     num_dummies = 30 - len(all_pseuds_from_db)
    #     dummy_pseuds = [f"dummy_pseud_{i}" for i in range(num_dummies)]
    #     all_pseuds_from_db.extend(dummy_pseuds)
        
    # We'll let the frontend cap at 20, seed all available or a reasonable number
    all_pseuds = random.sample(all_pseuds_from_db, min(len(all_pseuds_from_db), 200)) # Seed for more than 20 to allow variety

    now = datetime.now().replace(microsecond=0)
    to_upsert = []

    for p_idx, p in enumerate(all_pseuds):
        # Use a consistent fake name for each pseudonym for better testing
        # fake_name_idx = p_idx % (len(DEVICE_BRANDS) * len(GREEK_NAMES))
        # brand_idx = fake_name_idx // len(GREEK_NAMES)
        # name_idx = fake_name_idx % len(GREEK_NAMES)
        # fake_name = f"{DEVICE_BRANDS[brand_idx]}_{GREEK_NAMES[name_idx]}"
        fake_name = f"{random.choice(DEVICE_BRANDS)}_{random.choice(GREEK_NAMES)}"


        # Generate 2-3 movement patterns (type='last_seen')
        for m_template in random.sample(MOVEMENT_TEMPLATES, random.randint(2, 3)):
            to_upsert.append((p, fake_name, 'last_seen', m_template, now))

        # Generate 1-2 social templates (type='cooccur')
        for s_template in random.sample(SOCIAL_TEMPLATES, random.randint(1, 2)):
            to_upsert.append((p, fake_name, 'cooccur', s_template, now))
        
        # Generate 1-2 co-location messages (type='cooccur')
        for _ in range(random.randint(1, 2)):
            other_device_name = f"{random.choice(DEVICE_BRANDS)}_{random.choice(GREEK_NAMES)}"
            location = random.choice(BUILDINGS)
            coloc_msg = random.choice(COLOCATION_TEMPLATES).format(other_device=other_device_name, location=location)
            to_upsert.append((p, fake_name, 'cooccur', coloc_msg, now))

        # 10% chance to add a DEVICE_JABS (type='cooccur')
        if random.random() < 0.1:
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