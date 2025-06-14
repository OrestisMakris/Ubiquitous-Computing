import mysql.connector
from datetime import datetime, timedelta
import random

# --- Config: update with your credentials ---
DB_CONF = dict(
    host="127.0.0.1", user="root", password="tsitsitsitsi", database="dashboard"
)

# --- Enhanced Templates ---
BUILDINGS = [
    "Amphitheater C", "Amphitheater E1", "Amphitheater E2",
    "Lab D1", "Lab D2", "Building B", "Library", "Cafeteria"
]
DEVICE_JABS = [
    "We rarely see '{name}' around here—mystery device!",
    "'{name}' must be skipping all lectures…",
    "Last week, '{name}' camped out in the Cafeteria for hours.",
    "Are they living in Lab D2? '{name}' shows up every afternoon.",
    "Funny: '{name}' vanishes during exam weeks.",
    "‘{name}’ clocks more hours in the Library than students do.",
]
CLASS_TIMES = [
    "after the 10 AM lecture",
    "during the 2 PM seminar",
    "right before the 8 AM lab",
    "around the 5 PM workshop",
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
SOCIAL_TEMPLATES = [
    "Clubs: Debate Team",
    "Clubs: Gaming Club, Study Group",
    "Clubs: Drama Society",
    "Behavioral Note: Prioritizing fun over exam prep?",
    "Behavioral Note: Potential work–life balance struggles",
    "Behavioral Note: Close social collaboration detected"
]
CLASS_TIMES = [
    "after the 10 AM lecture",
    "during the 2 PM seminar",
    "right before the 8 AM lab",
    "around the 5 PM workshop"
]

def random_time():
    if random.random() < 0.6:
        hour = random.randint(11,14)
    else:
        hour = random.choice(list(range(8,11)) + list(range(15,22)))
    minute = random.randint(0,59)
    return f"{hour:02d}:{minute:02d}"



GREEK_NAMES = [
    "Γιώργος","Μαρία","Αλέξανδρος","Ελένη","Δημήτρης",
    "Κατερίνα","Νίκος","Άννα","Σπύρος","Χριστίνα"
]
DEVICE_BRANDS = ["iPhone","Samsung","HTC","Pixel","OnePlus","Airpods", "MacBook", "Dell", "Lenovo", "HP", "Asus"]


def seed_synthetic():
    db = mysql.connector.connect(**DB_CONF)
    cur = db.cursor(dictionary=True)
    cur.execute("TRUNCATE TABLE synthetic_patterns")

    cur.execute("SELECT DISTINCT pseudonym FROM device_sessions")
    all_pseuds = [r['pseudonym'] for r in cur.fetchall()]
    all_pseuds = random.sample(all_pseuds, min(len(all_pseuds), 20))

    now = datetime.now().replace(microsecond=0)
    to_upsert = []

    for p in all_pseuds:
        fake_name = f"{random.choice(DEVICE_BRANDS)}_{random.choice(GREEK_NAMES)}"
        # generate 2–4 movement msgs
        for m in random.sample(MOVEMENT_TEMPLATES, random.randint(2,4)):
            to_upsert.append((p, fake_name, 'last_seen', f"📍 {m}.", now))
        # generate 2–4 social msgs
        for s in random.sample(SOCIAL_TEMPLATES, random.randint(2,4)):
            to_upsert.append((p, fake_name, 'cooccur', f"👥 {s}.", now))

        for _ in range(random.randint(1,2)):
            ct = random.choice(CLASS_TIMES)
            bld = random.choice(BUILDINGS)
            to_upsert.append((p, fake_name, 'routine', f"⏱️ Typically active {ct} in the {bld}.", now))

    sql = """
      INSERT INTO synthetic_patterns
        (pseudonym, device_name, pattern_type, message, created_at)
      VALUES (%s,%s,%s,%s,%s)
      ON DUPLICATE KEY UPDATE
        device_name=VALUES(device_name),
        message=VALUES(message),
        created_at=VALUES(created_at)
    """
    cur.executemany(sql, to_upsert)
    db.commit()
    cur.close()
    db.close()

if __name__ == "__main__":
    seed_synthetic()