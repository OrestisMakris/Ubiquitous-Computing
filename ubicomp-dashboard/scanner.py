# ubicomp-dashboard/scanner.py

import asyncio
import requests
import time
import hashlib
import random
from bleak import BleakScanner

SERVER_URL = "http://192.168.1.107:3000/api/device-log"
SESSION_KEY   = "temporary_secret_2025"
SCAN_INTERVAL = 10  # seconds

def hash_mac(mac, session_key):
    return hashlib.sha256((mac + session_key).encode()).hexdigest()[:12]

async def run_cycle():
    print("\n--- New Scan Cycle (BLE) ---", flush=True)
    devices = await BleakScanner.discover()
    print(f"Found {len(devices)} BLE devices", flush=True)

    if not devices:
        print("? No BLE devices this cycle.", flush=True)

    for d in devices:
        mac = d.address
        name = d.name or "Unknown"
        rssi = d.rssi
        pseudonym = hash_mac(mac, SESSION_KEY)
        payload = {"mac": pseudonym, "name": name, "rssi": rssi}

        print("? payload:", payload, flush=True)
        try:
            resp = requests.post(SERVER_URL, json=payload, timeout=5)
            print(f"POST {resp.status_code}", flush=True)
        except Exception as e:
            print("Request failed:", e, flush=True)

def main():
    print("Starting BLE scanner...", flush=True)
    while True:
        asyncio.run(run_cycle())
        time.sleep(SCAN_INTERVAL)

if __name__ == "__main__":
    main()
