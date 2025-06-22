import mysql.connector
import random
from datetime import datetime

# --- Config ---
DB_CONF = dict(
    host="127.0.0.1", user="root", password="tsitsitsitsi", database="dashboard"
)

# --- Data Pools ---
BUILDINGS = [
    "Amphitheater C", "Amphitheater E1", "Amphitheater E2",
    "Lab D1", "Lab D2", "Building B", "Library", "Cafeteria",
    "Academic Zone", "Courtyard", "Student Hub", "Research Center",
    "Sports Complex", "Administration Building"
]
DEVICE_BRANDS = [
    "iPhone", "Samsung", "HTC", "Pixel", "OnePlus",
    "Airpods", "MacBook", "Lenovo", "Asus", "Dell", "BT_Device"
]
GREEK_NAMES = [
    "Γιώργος", "Μαρία", "Αλέξανδρος", "Ελένη", "Δημήτρης",
    "Κατερίνα", "Νίκος", "Άννα", "Σπύρος", "Χριστίνα"
]

# --- Template Definitions ---
# Social / co-occurrence insights
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

# Class-time routine insights
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

# Time-of-day movement templates
TIME_OF_DAY_TEMPLATES = [
    "Active around {location} in the {time_of_day}",
    "Often seen at {location} during the {time_of_day}",
    "Checks in at {location} each {time_of_day}",
    "Spotted near {location} in the {time_of_day}",
    "Regularly around {location} every {time_of_day}"
]
TIME_PERIODS = ["morning", "afternoon", "midday", "evening"]

def random_time_str():
    hour = random.randint(8, 22)
    minute = random.choice([0,5,10,15,20,25,30,35,40,45,50,55])
    return f"{hour:02d}:{minute:02d}"

def seed_synthetic():
    db = mysql.connector.connect(**DB_CONF)
    cur = db.cursor(dictionary=True)
    cur.execute("TRUNCATE TABLE synthetic_patterns")

    # collect pseudonyms
    cur.execute("SELECT DISTINCT pseudonym FROM device_sessions")
    pseuds = [r['pseudonym'] for r in cur.fetchall()]

    # ensure at least 50
    if len(pseuds) < 50:
        pseuds += [f"dummy_pseud_seed_{i}" for i in range(50 - len(pseuds))]
    # limit to 200
    pseuds = random.sample(pseuds, min(len(pseuds), 200))

    now = datetime.now().replace(microsecond=0)
    to_upsert = []

    for p in pseuds:
        fake_name = f"{random.choice(DEVICE_BRANDS)}_{random.choice(GREEK_NAMES)}"

        # 1) Last-spotted messages: 1–2
        for _ in range(random.randint(1,2)):
            bld = random.choice(BUILDINGS)
            tme = random_time_str()
            msg = f"Last spotted at {bld} around {tme}"
            to_upsert.append((p, fake_name, 'last_seen', msg, now))

        # 2) One co-location snippet
        co_tpl   = random.choice(COLOCATION_TEMPLATES)
        other_pd = f"{random.choice(DEVICE_BRANDS)}_{random.choice(GREEK_NAMES)}"
        loc      = random.choice(BUILDINGS)
        msg = co_tpl.format(other_device=other_pd, location=loc)
        to_upsert.append((p, fake_name, 'last_seen', msg, now))

        # 3) One time-of-day snippet
        tod_tpl = random.choice(TIME_OF_DAY_TEMPLATES)
        loc     = random.choice(BUILDINGS)
        tod     = random.choice(TIME_PERIODS)
        msg = tod_tpl.format(location=loc, time_of_day=tod)
        to_upsert.append((p, fake_name, 'last_seen', msg, now))

        # 4) Social co-occurrence: 3–6 messages
        selected = set()
        # ensure at least one club/behavior
        selected.add(random.choice(SOCIAL_TEMPLATES))
        pool = (
            [s for s in SOCIAL_TEMPLATES if s not in selected] +
            [tpl.format(other_device=f"{random.choice(DEVICE_BRANDS)}_{random.choice(GREEK_NAMES)}",
                        location=random.choice(BUILDINGS))
             for tpl in COLOCATION_TEMPLATES] +
            [tpl.format(name=fake_name) for tpl in DEVICE_JABS]
        )
        random.shuffle(pool)
        while len(selected) < random.randint(3,6) and pool:
            selected.add(pool.pop())
        for msg in selected:
            to_upsert.append((p, fake_name, 'cooccur', msg, now))

        # 5) Routine/class-time: 1–2 messages
        for _ in range(random.randint(1,2)):
            activity = random.choice(CLASS_TIMES_ACTIVITIES)
            bld = random.choice(BUILDINGS)
            msg = f"Typically active {activity} in the {bld}."
            to_upsert.append((p, fake_name, 'routine', msg, now))

    # bulk upsert
    sql = """
      INSERT INTO synthetic_patterns
        (pseudonym, device_name, pattern_type, message, created_at)
      VALUES (%s,%s,%s,%s,%s)
      ON DUPLICATE KEY UPDATE
        device_name = VALUES(device_name),
        message     = VALUES(message),
        created_at  = VALUES(created_at)
    """
    if to_upsert:
        cur.executemany(sql, to_upsert)
        db.commit()

    cur.close()
    db.close()
    print(f"Seeded {len(to_upsert)} entries for {len(pseuds)} pseudonyms.")

if __name__ == "__main__":
    seed_synthetic()