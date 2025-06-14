import asyncio
from bleak import BleakScanner

async def scan():
    print("Scanning for BLE devices...")
    devices = await BleakScanner.discover()
    for d in devices:
        print(f"{d.address} - {d.name}")

asyncio.run(scan())
