import bluetooth
import hashlib
import requests
import time
from bluepy.btle import Scanner

# ---- Config ----
SERVER_URL     = "http://192.168.1.107:3000/api/device-log"
SESSION_KEY    = "temporary_secret_2025"
SCAN_INTERVAL  = 10  # seconds
SCANNER_LOCATION = "Room_B"

# ---- Major Class Mapping ----
MAJOR_CLASSES = {
    0x00: "Misc",
    0x01: "Computer",
    0x02: "Phone",
    0x03: "LAN/Network",
    0x04: "Audio/Video",
    0x05: "Peripheral",
    0x06: "Imaging",
    0x07: "Wearable",
    0x08: "Toy",
    0x09: "Health",
}

# ---- Utility Functions ----
def hash_mac(mac, session_key):
    return hashlib.sha256((mac + session_key).encode()).hexdigest()[:12]

def parse_major_class(device_class):
    major = (device_class >> 8) & 0x1F
    return MAJOR_CLASSES.get(major, "Unknown")

# ---- Classic BT Inquiry ----
def scan_bt():
    print("Scanning Classic Bluetooth devices...")
    try:
        devices = bluetooth.discover_devices(duration=8, lookup_names=True, lookup_class=True)
        result = {}
        for addr, name, dev_class in devices:
            mac = addr.replace(":", "")
            major = parse_major_class(dev_class)
            label = f"{name or 'BT_Device'} ({major})"
            result[mac.lower()] = (label, major)
        return result
    except Exception as e:
        print(f"[BT ERROR] {e}")
        return {}

# ---- BLE Passive Scan ----
def scan_ble(bt_lookup):
    scanner = Scanner()
    devices = scanner.scan(SCAN_INTERVAL)
    results = []
    for dev in devices:
        mac = dev.addr.replace(":", "").lower()
        rssi = dev.rssi
        if mac in bt_lookup:
            label, major = bt_lookup[mac]
        else:
            label, major = "BLE_Device (Unknown)", "Unknown"
        results.append((mac, rssi, label, major))
    return results

# ---- Main Loop ----
def main():
    while True:
        bt_lookup = scan_bt()
        ble_devices = scan_ble(bt_lookup)

        for mac, rssi, label, major in ble_devices:
            pseudonym = hash_mac(mac, SESSION_KEY)
            payload = {
                "mac": pseudonym,
                "name": label,
                "rssi": rssi,
                "location": SCANNER_LOCATION,
                "major_class": major
            }
            print("Sending:", payload)
            try:
                response = requests.post(SERVER_URL, json=payload)
                if response.status_code != 200:
                    print(f"[!] Server error: {response.status_code} - {response.text}")
            except Exception as e:
                print(f"[!] Request failed: {e}")

        time.sleep(SCAN_INTERVAL)

if __name__ == "__main__":
    main()
