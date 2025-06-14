import mysql.connector
from datetime import datetime, timedelta
import random

# --- Config: update with your credentials ---
DB_DEVICE = dict(
    host="localhost", user="youruser", password="yourpass", database="dashboard"
)
DB_PATTERN = dict(
    host="localhost", user="youruser", password="yourpass", database="dashboard_patterns"
)

# --- Templates ---
LOCATIONS     = ["Library", "Cafeteria", "Lab‑A", "Gym", "Main Entrance"]
OTHER_DEVICES = ["AirPods_Chris", "Laptop_Maria", "Pixel_Sam", "Watch_Alex"]
def random_time():
    return (datetime.now() - timedelta(minutes=random.randint(1, 600))).strftime("%H:%M")

def seed_patterns():
    # 1. fetch currently visible devices
    src = mysql.connector.connect(**DB_DEVICE)
    cur = src.cursor(dictionary=True)
    cur.execute("""
      SELECT DISTINCT pseudonym, device_name
      FROM device_sessions
      WHERE last_seen >= NOW() - INTERVAL 20 SECOND
    """)
    devices = cur.fetchall()
    cur.close(); src.close()

    if not devices:
        return

    # 2. generate fake messages
    patterns = []
    now = datetime.now().replace(microsecond=0)
    for d in devices:
        p, name = d['pseudonym'], d['device_name']
        # last_seen
        loc = random.choice(LOCATIONS)
        msg1 = f"Last spotted near {loc} at {random_time()}."
        # co‑occurrence
        other = random.choice(OTHER_DEVICES)
        msg2 = f"Frequently appears with '{other}' around noon."
        # routine
        msg3 = f"Regularly passes Scanner‑B at 08:30 most mornings."
        for typ, msg in [('last_seen', msg1), ('cooccur', msg2), ('routine', msg3)]:
            patterns.append((p, name, typ, msg, now))

    # 3. insert into device_patterns
    dst = mysql.connector.connect(**DB_PATTERN)
    cur2 = dst.cursor()
    cur2.executemany("""
      INSERT INTO device_patterns
        (pseudonym, device_name, pattern_type, message, created_at)
      VALUES (%s,%s,%s,%s,%s)
    """, patterns)
    dst.commit()
    cur2.close(); dst.close()

if __name__ == "__main__":
    seed_patterns()
