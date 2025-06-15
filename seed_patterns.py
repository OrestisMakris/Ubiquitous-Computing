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
    minute = random.choice([0,15,30,45])
    return f"{hour:02d}:{minute:02d}"

def seed_synthetic():
    db = mysql.connector.connect(**DB_CONF)
    cur = db.cursor(dictionary=True)
    cur.execute("TRUNCATE TABLE synthetic_patterns")

    cur.execute("SELECT DISTINCT pseudonym FROM device_sessions")
    pseuds = [r['pseudonym'] for r in cur.fetchall()]
    if len(pseuds) < 50:
        pseuds += [f"dummy_{i}" for i in range(50 - len(pseuds))]
    pseuds = random.sample(pseuds, min(len(pseuds),200))

    now = datetime.now().replace(microsecond=0)
    to_upsert = []

    for p in pseuds:
        fake_name = f"{random.choice(DEVICE_BRANDS)}_{random.choice(GREEK_NAMES)}"

        # 1) Movement: 2–4 “Last spotted …” messages
        for _ in range(random.randint(2,4)):
            b = random.choice(BUILDINGS)
            t = random_time_str()
            to_upsert.append((p, fake_name, 'last_seen',
                              f"Last spotted at {b} around {t}.", now))

        # 2) Social Insights: 2–5 items from SOCIAL_TEMPLATES + coloc + jabs
        count = random.randint(2,5)
        pool = SOCIAL_TEMPLATES + COLOCATION_TEMPLATES + DEVICE_JABS
        items = random.sample(SOCIAL_TEMPLATES,
                              min(2, len(SOCIAL_TEMPLATES)))  # ensure ≥2 real templates
        while len(items) < count:
            cand = random.choice(pool)
            if cand not in items:
                items.append(cand)
        for msg in items:
            to_upsert.append((p, fake_name, 'cooccur', msg, now))

        # 3) Routine unchanged
        for _ in range(random.randint(1,2)):
            act = random.choice(CLASS_TIMES_ACTIVITIES)
            b = random.choice(BUILDINGS)
            to_upsert.append((p, fake_name, 'routine',
                              f"Typically active {act} in the {b}.", now))

    sql = """
      INSERT INTO synthetic_patterns
        (pseudonym,device_name,pattern_type,message,created_at)
      VALUES (%s,%s,%s,%s,%s)
      ON DUPLICATE KEY UPDATE
        message=VALUES(message),
        created_at=VALUES(created_at)
    """
    cur.executemany(sql, to_upsert)
    db.commit()
    cur.close()
    db.close()
    print("Seeded", len(to_upsert), "entries")