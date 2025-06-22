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
DEVICE_BRANDS = ["iPhone","Samsung","HTC","Pixel","OnePlus","Airpods", "MacBook", "Lenovo", "Asus", "Dell", "BT_Device"]
GREEK_NAMES = [
    "Γιώργος","Μαρία","Αλέξανδρος","Ελένη","Δημήτρης",
    "Κατερίνα","Νίκος","Άννα","Σπύρος","Χριστίνα"
]

# --- Template Definitions ---

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
    minute = random.choice([0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55])
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

    for p_idx, p in enumerate(all_pseuds):
        fake_name = f"{random.choice(DEVICE_BRANDS)}_{random.choice(GREEK_NAMES)}"

        # 1. Synthetic Movement Patterns (type='last_seen')
        num_movement_messages = random.randint(3, 5)
        for _ in range(num_movement_messages):
            spot_building = random.choice(BUILDINGS)
            spot_time     = random_time_str()
            message       = f"Last spotted at {spot_building} around {spot_time}"
            to_upsert.append((p, fake_name, 'last_seen', message, now))


        
        selected_cooccur_messages = set() # Use a set to avoid duplicates initially

        # Ensure at least one item from SOCIAL_TEMPLATES (clubs/behavioral)
        if SOCIAL_TEMPLATES:
            selected_cooccur_messages.add(random.choice(SOCIAL_TEMPLATES))

        # Create a combined pool for remaining cooccur messages
        cooccur_pool = []
        if SOCIAL_TEMPLATES: # Add remaining social templates
             cooccur_pool.extend(s for s in SOCIAL_TEMPLATES if s not in selected_cooccur_messages)
        if COLOCATION_TEMPLATES:
            cooccur_pool.extend([
                tpl.format(other_device=f"{random.choice(DEVICE_BRANDS)}_{random.choice(GREEK_NAMES)}", location=random.choice(BUILDINGS))
                for tpl in COLOCATION_TEMPLATES
            ])
        if DEVICE_JABS:
            cooccur_pool.extend([tpl.format(name=fake_name) for tpl in DEVICE_JABS])
        
        random.shuffle(cooccur_pool)

        num_total_cooccur_messages = random.randint(3, 6)
        
        # Fill up to the desired number of cooccur messages
        while len(selected_cooccur_messages) < num_total_cooccur_messages and cooccur_pool:
            selected_cooccur_messages.add(cooccur_pool.pop())
            
        for msg in list(selected_cooccur_messages):
            to_upsert.append((p, fake_name, 'cooccur', msg, now))

        # 3. Routine messages (type='routine') - 1 to 2 messages
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