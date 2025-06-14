import subprocess
import time

def scan_bluetooth_devices():
    print("Starting Bluetooth scan...")
    
    # Start scanning
    subprocess.run("bluetoothctl power on", shell=True, stdout=subprocess.DEVNULL)
    subprocess.run("bluetoothctl scan on", shell=True, stdout=subprocess.DEVNULL)
    time.sleep(10)  # Scan for 10 seconds

    # Get list of discovered devices
    output = subprocess.check_output("bluetoothctl devices", shell=True)
    devices = output.decode().split('\n')

    print("Found devices:")
    for device in devices:
        if device.strip():
            parts = device.strip().split(' ', 2)
            if len(parts) == 3:
                _, mac, name = parts
                print(f"{mac} - {name}")
            elif len(parts) == 2:
                _, mac = parts
                print(f"{mac} - (No name)")
    
    # Stop scanning
    subprocess.run("bluetoothctl scan off", shell=True, stdout=subprocess.DEVNULL)

scan_bluetooth_devices()
