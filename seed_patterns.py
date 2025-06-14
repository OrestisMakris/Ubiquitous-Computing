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
GREEK_NAMES = [
    "Γιώργος","Μαρία","Αλέξανδρος","Ελένη","Δημήτρης",
    "Κατερίνα","Νίκος","Άννα","Σπύρος","Χριστίνα"
]
DEVICE_BRANDS = ["iPhone","Samsung","HTC","Pixel","OnePlus","Airpods", "MacBook", "Dell", "Lenovo", "HP", "Asus"]
def seed_synthetic():
    db = mysql.connector.connect(**DB_CONF)
    cur = db.cursor(dictionary=True)
    cur.execute("TRUNCATE TABLE synthetic_patterns")

    # 1. fetch *all* pseudonyms ever seen
    cur.execute("SELECT DISTINCT pseudonym FROM device_sessions")
    all_pseuds = [r['pseudonym'] for r in cur.fetchall()]

    now = datetime.now().replace(microsecond=0)
    to_upsert = []

    for p in all_pseuds:
        # pick brand + Greek personal name
        fake_name = f"{random.choice(DEVICE_BRANDS)}_{random.choice(GREEK_NAMES)}"

        # generate three pattern messages
        bld = random.choice(BUILDINGS)
        ts  = random_time()
        msg1 = f"Last spotted at {bld} around {ts}."
        msg2 = f"Frequently co-located with {random.choice(DEVICE_BRANDS)}_{random.choice(GREEK_NAMES)} at {random.choice(BUILDINGS)}."
        msg3 = f"Typically active {random.choice(CLASS_TIMES)} in the {random.choice(BUILDINGS)}."

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
