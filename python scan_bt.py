import asyncio
import hashlib
import requests
import time
import bluetooth
from bleak import BleakScanner

# ---- Config ----
SERVER_URL = "http://192.168.1.107:3000/api/device-log"
SESSION_KEY = "temporary_secret_2025"
SCAN_INTERVAL = 4
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

# ---- Utilities ----
def hash_mac(mac, session_key):
    return hashlib.sha256((mac + session_key).encode()).hexdigest()[:12]

def parse_major_class(device_class):
    major = (device_class >> 8) & 0x1F
    return MAJOR_CLASSES.get(major, "Unknown")

# ---- Classic Bluetooth ----
def scan_classic_bt():
    try:
        print("Scanning Classic Bluetooth devices...")
        devices = bluetooth.discover_devices(duration=8, lookup_names=True, lookup_class=True)
        results = []
        for addr, name, dev_class in devices:
            mac = addr.replace(":", "")
            rssi = -60  # Classic BT doesn't return RSSI
            major = parse_major_class(dev_class)
            label = f"{name or 'BT_Device'} ({major})"
            results.append((mac, rssi, label))
        return results
    except Exception as e:
        print(f"[Classic BT Error] {e}")
        return []

# BLE Scanner with bleak
async def scan_ble():
    devices = await BleakScanner.discover(timeout=SCAN_INTERVAL)
    results = []
    for d in devices:
        mac = d.address.replace(":", "").lower()
        name = d.name or "BLE_Device"
        rssi = d.rssi
        major = "Unknown"  # For BLE devices, we don't have class
        label = f"{name} ({major})"
        results.append((mac, rssi, label, major))
    return results

# Classic Bluetooth already extracts major class
def scan_classic_bt():
    try:
        print("Scanning Classic Bluetooth devices...")
        devices = bluetooth.discover_devices(duration=8, lookup_names=True, lookup_class=True)
        results = []
        for addr, name, dev_class in devices:
            mac = addr.replace(":", "")
            rssi = -60  # Classic BT doesn't return RSSI
            major = parse_major_class(dev_class)
            label = f"{name or 'BT_Device'} ({major})"
            results.append((mac, rssi, label, major))
        return results
    except Exception as e:
        print(f"[Classic BT Error] {e}")
        return []

# Main loop
async def main_loop():
    while True:
        ble_devices = await scan_ble()
        bt_devices = scan_classic_bt()
        all_devices = ble_devices + bt_devices

        for mac, rssi, label, major in all_devices:
            pseudonym = hash_mac(mac, SESSION_KEY)
            payload = {
                "mac": pseudonym,
                "name": label,
                "rssi": rssi,
                "location": SCANNER_LOCATION,
                "major_class": major  # <-- Add this
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
    try:
        asyncio.run(main_loop())
    except KeyboardInterrupt:
        print("\n[!] Exiting...")
