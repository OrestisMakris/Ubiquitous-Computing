# Ubiquitous Computing - Live Bluetooth Environment Monitor

This project is a web-based dashboard for monitoring Bluetooth devices in the local environment. It captures device presence, analyzes patterns, and displays synthetic behavioral insights. The system consists of Python scripts for scanning and data seeding, a Next.js application for the frontend and API, and a MySQL database for data storage.

This project was developed for the CEID_NE576 — Ubiquitous Computing Live Exercise 2024/25 course by Orestis Antonis Makris, under Prof. Andreas Komninos.

## Features

*   **Live Device Tracking:** Displays currently visible Bluetooth devices.
*   **Synthetic Data Generation:** Creates plausible movement patterns and social insights for anonymized devices.
*   **Multiple Dashboard Views:**
    *   **Dashboard One:** General presence statistics (live count, daily unique, device type analysis).
    *   **Dashboard Two:** Pattern observer for temporary device names, proximity clusters, and recent activity timeline.
    *   **Dashboard Three:** "Active Surveillance Profiles" with detailed synthetic movement and social insights for selected devices.
*   **Anonymization:** Uses hashed MAC addresses as pseudonyms.

## Tech Stack

*   **Frontend:** Next.js, React, Tailwind CSS
*   **Backend API:** Node.js (Next.js API routes)
*   **Database:** MySQL
*   **Bluetooth Scanning & Data Seeding:** Python 3
    *   Libraries: `bleak` (for BLE scanning), `requests`, `mysql-connector-python`
*   **OS for Scanner:** Linux (recommended for `bleak` full functionality, or for `bluetoothctl` if using alternative scanner scripts). Windows/macOS for Next.js development.

## Project Structure

```
Ubiquitous-Computing/
├── ubicomp-dashboard/        # Next.js project
│   ├── app/                  # Next.js App Router (layout, globals)
│   ├── components/           # React components (Dashboards, UI elements)
│   ├── lib/                  # Database connection (db.js)
│   ├── pages/                # Next.js Pages Router (index, API routes)
│   │   └── api/              # API endpoints
│   ├── public/               # Static assets
│   ├── next.config.ts
│   ├── package.json
│   └── ...
├── seed_patterns.py          # Python script to seed synthetic pattern data
├── scanner.py                # Python script for BLE device scanning (uses bleak)
├── sc.py                     # Alternative Python scanner (uses bluepy, older)
├── sccr.py                   # Alternative Python scanner (uses bluetoothctl)
└── README.md                 # This file
```

## Setup and Installation

Refer to `INSTALLATION_GUIDE.md` for detailed setup instructions. A guide for Raspberry Pi setup is available in `RASPBERRY_PI_SETUP.md`.

**Quick Overview:**

1.  **Prerequisites:**
    *   Node.js (LTS version recommended, e.g., v18+)
    *   Python (3.8+ recommended)
    *   MySQL Server
    *   Git
    *   (Linux for scanner) Bluetooth development libraries (e.g., `libbluetooth-dev`, `libglib2.0-dev` for `bleak`).
2.  **Clone the repository.**
3.  **Setup MySQL Database:** Create a database (e.g., `dashboard`) and the required tables (`device_sessions`, `synthetic_patterns`).
4.  **Configure Python Scripts:**
    *   Create a Python virtual environment and install dependencies (`bleak`, `requests`, `mysql-connector-python`).
    *   Update database credentials in `seed_patterns.py`.
    *   Update `SERVER_URL` (e.g., `http://localhost:3000/api/device-log`) and `SESSION_KEY` in `scanner.py`.
5.  **Configure Next.js Application (`ubicomp-dashboard`):**
    *   Update database credentials in `lib/db.js`.
    *   Ensure `SESSION_KEY` in `pages/api/device-log.js` matches the one in `scanner.py`.
    *   Install Node.js dependencies: `npm install`.

## Running the Project

1.  **Start MySQL Server.**
2.  **Run the Python Scanner:**
    ```bash
    # Navigate to the root project directory
    # Activate your Python virtual environment
    python scanner.py
    ```
3.  **Run the Python Data Seeder (Optional, for initial data or updates):**
    ```bash
    # Navigate to the root project directory
    # Activate your Python virtual environment
    python seed_patterns.py
    ```
4.  **Start the Next.js Development Server:**
    ```bash
    # Navigate to the ubicomp-dashboard directory
    npm run dev
    ```
5.  Access the dashboard in your browser, typically at `http://localhost:3000`.

## Key Scripts

*   **`scanner.py`:** Actively scans for BLE devices using `bleak` and sends data to the `/api/device-log` endpoint.
*   **`seed_patterns.py`:** Populates the `synthetic_patterns` table in the database with generated movement and social insights.

## Main API Endpoints

Located in `ubicomp-dashboard/pages/api/`:

*   `device-log.js`: Receives data from the Python scanner.
*   `pattern-last-seen.js`: Provides movement patterns and real last seen data.
*   `pattern-cooccur.js`: Provides co-occurrence based social insights.
*   `pattern-routine.js`: Provides routine-based social insights.
*   Other endpoints for specific dashboard statistics (e.g., `live-count.js`, `name-analysis.js`).

## Author

*   **Orestis Antonis Makris** (AM 1084516)
```