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

def random_time():
    return (datetime.now() - timedelta(minutes=random.randint(1, 600))).strftime("%H:%M")

def seed_synthetic():
    db = mysql.connector.connect(**DB_CONF)
    cur = db.cursor(dictionary=True)

    # 1. fetch *all* pseudonyms ever seen
    cur.execute("SELECT DISTINCT pseudonym FROM device_sessions")
    all_pseuds = [r['pseudonym'] for r in cur.fetchall()]

    now = datetime.now().replace(microsecond=0)
    to_upsert = []

    for p in all_pseuds:
        # pick a fake public name
        fake_name = f"Device_{p[:4]}"  

        # last_seen near a building + time
        loc = random.choice(BUILDINGS)
        msg1 = f"Last spotted at {loc} around {random_time()}."

        # co-occurrence with jab
        msg2 = random.choice(DEVICE_JABS).format(name=fake_name)

        # routine: mention class time or long stay
        if random.random() < 0.5:
            ct = random.choice(CLASS_TIMES)
            msg3 = f"Seen {ct} near {random.choice(BUILDINGS)}."
        else:
            loc2 = random.choice(BUILDINGS)
            hrs = random.randint(1, 5)
            msg3 = f"Spent about {hrs}h in {loc2} yesterday."

        for typ, msg in [('last_seen', msg1), ('cooccur', msg2), ('routine', msg3)]:
            to_upsert.append((p, fake_name, typ, msg, now))

    # 2. Upsert into synthetic_patterns
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
