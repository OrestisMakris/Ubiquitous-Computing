# Ubiquitous Computing Environment Monitor - Installation Guide

This guide provides detailed steps to set up and run the Ubiquitous Computing Environment Monitor project.

## 1. System Requirements

*   **Operating System:**
    *   **For Next.js Development & Hosting:** Linux, macOS, or Windows.
    *   **For Python Scanner (`scan_bt.py`):** Linux is highly recommended for full Bluetooth functionality (`bleak` and `PyBluez`). macOS is possible but may require more configuration for Classic Bluetooth. Windows may have limitations.
*   **Software:**
    *   **Node.js:** LTS version (e.g., v18.x or v20.x). Download from [nodejs.org](https://nodejs.org/). Includes npm.
    *   **Python:** Version 3.8 to 3.11 recommended (due to `PyBluez` compatibility). Download from [python.org](https://python.org/).
    *   **MySQL Server:** Version 5.7 or newer (MariaDB is a compatible alternative).
    *   **Git:** For cloning the repository.
*   **Python Dependencies (for scanner & seeder):** `bleak`, `requests`, `mysql-connector-python`, `PyBluez` (for Classic Bluetooth scanning).
*   **Linux Bluetooth Libraries (for scanner):** `libbluetooth-dev`, `libglib2.0-dev` (or equivalent package names for your distribution).

## 2. Clone the Repository

Open your terminal or command prompt and run:

```bash
git clone <https://github.com/OrestisMakris/Ubiquitous-Computing.git> 
cd Ubiquitous-Computing 
```

## 3. Database Setup (MySQL/MariaDB)

1.  **Install MySQL/MariaDB Server:**
    *   Follow instructions for your OS. For Debian/Ubuntu: `sudo apt install mysql-server` or `sudo apt install mariadb-server`.
2.  **Secure Installation (Recommended):**
    *   For MySQL: `sudo mysql_secure_installation`
    *   For MariaDB: `sudo mariadb-secure-installation`
3.  **Log in to MySQL/MariaDB:**
    ```bash
    sudo mysql -u root -p
    ```
    (Enter the root password you set).
4.  **Create Database and User:**
    Execute the following SQL commands:
    ```sql
    CREATE DATABASE dashboard CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    CREATE USER 'ubicomp_user'@'localhost' IDENTIFIED BY 'your_strong_password'; -- Choose a strong password
    GRANT ALL PRIVILEGES ON dashboard.* TO 'ubicomp_user'@'localhost';
    FLUSH PRIVILEGES;
    EXIT;
    ```
5.  **Create Tables for Real & Synthetic Data:**
    Log back into MySQL/MariaDB as `ubicomp_user`:
    ```bash
    mysql -u ubicomp_user -p dashboard
    ```
    (Enter the password for `ubicomp_user`).
    Then, execute the following SQL to create the necessary tables:

    ```sql
    -- Table for storing real-time scanned device data
    CREATE TABLE device_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        pseudonym VARCHAR(64) NOT NULL,         -- Hashed MAC address
        device_name VARCHAR(255),               -- Advertised device name
        signal_strength INT,                    -- RSSI value
        scanner_location VARCHAR(50) NOT NULL,  -- Identifier for the scanner location
        major_class VARCHAR(50),                -- Bluetooth major device class (e.g., Phone, Computer)
        last_seen TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, -- Timestamp of the last detection
        INDEX idx_pseudonym (pseudonym),        -- Index for faster lookups by pseudonym
        INDEX idx_last_seen (last_seen)         -- Index for time-based queries
    );

    -- Table for storing synthetically generated behavioral patterns
    CREATE TABLE synthetic_patterns (
        id INT AUTO_INCREMENT PRIMARY KEY,
        pseudonym VARCHAR(64) NOT NULL,         -- Hashed MAC address, links to device_sessions
        device_name VARCHAR(255),               -- Associated device name (can be from synthetic generation)
        pattern_type VARCHAR(50) NOT NULL,      -- Type of pattern (e.g., 'last_seen', 'cooccur', 'routine')
        message TEXT NOT NULL,                  -- The textual description of the pattern
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, -- Timestamp of pattern creation
        UNIQUE KEY unique_pattern (pseudonym, pattern_type, message(255)) -- Ensures unique patterns per device/type
    );
    ```
## 4. Python Scripts Setup

The Python scripts are responsible for scanning Bluetooth devices (`Python_Scanning/scan_bt.py`) and seeding the database with synthetic behavioral patterns (`ubicomp-dashboard/seed_patterns.py`).

1.  **Navigate to Project Root:**
    If not already there, `cd /path/to/Ubiquitous-Computing`.
2.  **Create and Activate Python Virtual Environment:**
    It's highly recommended to use a virtual environment to manage Python dependencies.
    ```bash
    python3 -m venv .venv
    source .venv/bin/activate  # On Linux/macOS
    # .venv\Scripts\activate   # On Windows (Command Prompt)
    # .venv\Scripts\Activate.ps1 # On Windows (PowerShell)
    ```
    You should see `(.venv)` at the beginning of your terminal prompt.
3.  **Install Python Dependencies:**
    Create a `requirements.txt` file in the **project root** (`Ubiquitous-Computing/`) with the following content:
    ```txt
    # requirements.txt
    bleak
    requests
    mysql-connector-python
    PyBluez # For Classic Bluetooth scanning
    ```
    Then, ensure `pip` is upgraded and install the packages:
    ```bash
    python -m pip install --upgrade pip
    pip install -r requirements.txt
    ```
    *Note on PyBluez:* If you encounter issues installing PyBluez on newer Python versions or non-Linux systems, you might need to install development packages (like `python3-dev` and `libbluetooth-dev` on Debian/Ubuntu) or look for alternative installation methods/wheels specific to your OS.
4.  **Configure Python Scripts:**
    *   **`ubicomp-dashboard/seed_patterns.py`:**
        Open this file and update the `DB_CONF` dictionary with your MySQL credentials:
        ```python
        # ubicomp-dashboard/seed_patterns.py
        DB_CONF = dict(
            host="127.0.0.1",  # Or your MySQL host if not localhost
            user="ubicomp_user",
            password="your_strong_password", # The password you set for ubicomp_user
            database="dashboard"
        )
        ```
    *   **`Python_Scanning/scan_bt.py`:**
        Open this file and configure:
        *   `SERVER_URL`: Set to your Next.js API endpoint. If running Next.js locally, this is typically `http://localhost:3000/api/device-log`. If Next.js is on a different machine on the same network, use its IP address (e.g., `http://192.168.1.107:3000/api/device-log`).
        *   `SESSION_KEY`: Choose a strong, unique secret string. This **must** be the same as the `SESSION_KEY` set in the Next.js application's environment variables.
        *   `SCANNER_LOCATION`: A descriptive name for where this scanner is physically located (e.g., "Room_B", "Main_Lab").
        ```python
        # Python_Scanning/scan_bt.py
        SERVER_URL = "http://localhost:3000/api/device-log" # Adjust if Next.js runs elsewhere
        SESSION_KEY = "your_very_secret_and_unique_key_2025" # MUST MATCH Next.js .env.local
        SCANNER_LOCATION = "Default_Scanner_Location" # Customize (e.g., "Lab_A_Scanner")
        ```

## 5. Next.js Application Setup (`ubicomp-dashboard`)

The Next.js application serves the web dashboard and the backend API endpoints.

1.  **Navigate to Next.js Directory:**
    ```bash
    cd ubicomp-dashboard
    ```
2.  **Create Environment Configuration File:**
    Create a file named `.env.local` in the `ubicomp-dashboard` directory. This file will store sensitive configuration and is ignored by Git (if `.env.local` is in your `.gitignore` file, which is good practice).
    Add the following content, replacing placeholder values with your actual database credentials and the session key:
    ```env
    # ubicomp-dashboard/.env.local

    # Database Configuration
    DB_HOST='127.0.0.1'       # Or your MySQL host
    DB_USER='ubicomp_user'
    DB_PASSWORD='your_strong_password' # The password for ubicomp_user
    DB_NAME='dashboard'

    # Session Key for MAC Hashing
    # IMPORTANT: This MUST be the exact same key used in Python_Scanning/scan_bt.py
    SESSION_KEY='your_very_secret_and_unique_key_2025'
    ```
    The `lib/db.js` file is typically set up to read these environment variables. If it's hardcoding credentials, modify it to use `process.env.DB_HOST`, etc.
    The `pages/api/device-log.js` should also use `process.env.SESSION_KEY`.
3.  **Install Node.js Dependencies:**
    This command reads the `package.json` file and installs all necessary Node.js packages.
    ```bash
    npm install
    ```
    If you encounter issues, ensure you have a compatible version of Node.js and npm installed.

## 6. Running the Application

1.  **Ensure MySQL/MariaDB server is running.**
2.  **Run the Python Scanner Script:**
    Open a new terminal. Navigate to the `Python_Scanning` directory. Activate the Python virtual environment if you haven't already in this terminal session.
    ```bash
    cd /path/to/Ubiquitous-Computing/Python_Scanning
    # If not already active: source ../.venv/bin/activate  (adjust path if needed)
    python scan_bt.py
    ```
    (On Linux, you might need `sudo python scan_bt.py` if you encounter permission issues with Bluetooth, or configure user permissions for Bluetooth access.)
    You should see output indicating scanning activity and data being sent.
3.  **Run the Python Data Seeder (Optional - for initial data or to refresh synthetic patterns):**
    Open another terminal. Navigate to the `ubicomp-dashboard` directory (where `seed_patterns.py` is located). Activate the Python virtual environment.
    ```bash
    cd /path/to/Ubiquitous-Computing/ubicomp-dashboard
    # If not already active: source ../.venv/bin/activate (adjust path if needed)
    python seed_patterns.py
    ```
    This will populate the `synthetic_patterns` table.
4.  **Start the Next.js Server:**
    Open another terminal. Navigate to the `ubicomp-dashboard` directory.
    *   **For development (with hot reloading):**
        ```bash
        npm run dev
        ```
    *   **For production (after building the app):**
        First, build the application:
        ```bash
        npm run build
        ```
        Then, start the production server:
        ```bash
        npm start
        ```
5.  **Access the Dashboard:**
    Open your web browser and go to `http://localhost:3000` (or the port specified if `npm run dev` or `npm start` indicates a different one).

## 7. Troubleshooting

*   **Database Connection Issues:**
    *   Verify that your MySQL/MariaDB server is running.
    *   Double-check `DB_HOST`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME` in `ubicomp-dashboard/.env.local` and in `ubicomp-dashboard/seed_patterns.py`.
    *   Ensure the `ubicomp_user` has the correct privileges for the `dashboard` database from the host where your Next.js app and Python scripts are running (usually `localhost`).
*   **Python `ModuleNotFoundError`:**
    *   Ensure your Python virtual environment (`.venv`) is activated in the terminal session where you are trying to run `scan_bt.py` or `seed_patterns.py`.
    *   Confirm that all dependencies from `requirements.txt` were installed successfully into the virtual environment.
*   **Bluetooth Scanner Permissions (Linux):**
    *   `bleak` and `PyBluez` might require root privileges (`sudo python scan_bt.py`).
    *   Alternatively, add your user to the `bluetooth` group: `sudo usermod -aG bluetooth $USER`. You'll need to log out and log back in for this change to take effect.
    *   Ensure Bluetooth service is running: `sudo systemctl status bluetooth`.
*   **`SESSION_KEY` Mismatch:** If devices are logged but pseudonyms seem inconsistent between what the scanner sends and what the API processes, or if data doesn't link up correctly in DashboardThree, ensure the `SESSION_KEY` is **exactly identical** in `Python_Scanning/scan_bt.py` and `ubicomp-dashboard/.env.local`.
*   **API Errors (e.g., 400, 500):** Check the terminal output where `npm run dev` (or `npm start`) is running. This usually provides detailed error messages from the Next.js API routes.
*   **npm Install Failures:** Ensure Node.js and npm are up to date. Sometimes, deleting `node_modules` and `package-lock.json` (or `yarn.lock`) and running `npm install` again can resolve issues.
```// filepath: c:\Users\orest\OneDrive - University of Patras\Documents\GitHub\Ubiquitous-Computing\InstallationGuide.md
# Ubiquitous Computing Environment Monitor - Installation Guide