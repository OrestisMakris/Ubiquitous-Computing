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

The Next.js application serves the web dashboard and the backend API endpoints. This setup involves configuring environment variables and installing Node.js dependencies.

1.  **Navigate to Next.js Directory:**
    From your project's root directory (`Ubiquitous-Computing`), change to the Next.js application directory:
    ```bash
    cd ubicomp-dashboard
    ```

2.  **Create and Configure Environment Variables (`.env.local`):**
    Environment variables are crucial for managing configuration that varies between environments (development, production) or contains sensitive information like API keys and database credentials. Next.js has built-in support for environment variables using `.env` files.

    *   **Create the file:** In the `ubicomp-dashboard` directory, create a file named `.env.local`.
        ```bash
        # Example for Linux/macOS
        touch .env.local
        # For Windows, you can create it manually with a text editor.
        ```
    *   **Purpose of `.env.local`:**
        *   Variables defined in `.env.local` are loaded by Next.js during development (`npm run dev`) and at build time (`npm run build`).
        *   This file is **not committed to Git** (it should be listed in your `.gitignore` file) to keep sensitive credentials secure and out of version control.
        *   It overrides variables defined in other `.env` files (like `.env.development` or `.env.production`) for your local setup.
    *   **Add Configuration:** Open `.env.local` with a text editor and add the following content. **Replace placeholder values with your actual settings.**
        ```env
        # ubicomp-dashboard/.env.local

        # --- Database Configuration ---
        # These are used by `lib/db.js` to connect to your MySQL/MariaDB instance.
        DB_HOST='127.0.0.1'       # Hostname or IP address of your database server.
        DB_USER='ubicomp_user'    # The database user you created.
        DB_PASSWORD='your_strong_password' # The password for 'ubicomp_user'.
        DB_NAME='dashboard'       # The name of the database you created.

        # --- Session Key for MAC Hashing ---
        # This key is used by `/api/device-log.js` to create pseudonyms.
        # IMPORTANT: This MUST be the exact same secret key used in `Python_Scanning/scan_bt.py`.
        SESSION_KEY='your_very_secret_and_unique_key_2025'

        # --- Next.js Specific (Optional) ---
        # NEXT_PUBLIC_SOME_VARIABLE='this_can_be_read_by_browser' # Variables prefixed with NEXT_PUBLIC_ are exposed to the browser.
                                                              # Avoid putting sensitive info in NEXT_PUBLIC_ variables.
        ```
    *   **Accessing Environment Variables in Code:**
        *   **Backend (API Routes, `getServerSideProps`):** `process.env.DB_HOST`, `process.env.SESSION_KEY`
        *   **Frontend (Browser):** Only variables prefixed with `NEXT_PUBLIC_` (e.g., `process.env.NEXT_PUBLIC_ANALYTICS_ID`).

3.  **Install Node.js Dependencies (`npm install`):**
    Node.js projects use `npm` (Node Package Manager) or `yarn` to manage external libraries and tools (dependencies) listed in the `package.json` file.

    *   **What `npm install` does:**
        *   Reads `package.json` to identify all project dependencies (e.g., React, Next.js, Tailwind CSS, Recharts) and development dependencies (e.g., ESLint, Prettier).
        *   Downloads these packages from the npm registry (or a configured private registry).
        *   Installs them into a `node_modules` directory within `ubicomp-dashboard`. This directory can be very large and is typically not committed to Git.
        *   Creates or updates a `package-lock.json` file. This file records the exact versions of all installed packages and their sub-dependencies, ensuring consistent installations across different machines and times (deterministic builds). **It's important to commit `package-lock.json` to Git.**
    *   **Run the command:**
        ```bash
        npm install
        ```
        This command might take a few minutes, especially on the first run or if there are many dependencies.
    *   **Common `npm install` Issues:**
        *   **Network Issues:** Ensure you have a stable internet connection.
        *   **Permissions:** On some systems, you might encounter permission errors. Avoid using `sudo npm install` globally if possible; manage Node.js versions with tools like `nvm` (Node Version Manager) to avoid permission issues.
        *   **Outdated npm/Node.js:** Ensure your Node.js and npm versions are compatible with the project's requirements (check `package.json` "engines" field if present, or project documentation). Update Node.js (which usually updates npm) if necessary.
        *   **Corrupted `node_modules` or `package-lock.json`:** If you face persistent issues, try deleting the `node_modules` directory and the `package-lock.json` file, then run `npm install` again:
            ```bash
            rm -rf node_modules package-lock.json # Linux/macOS
            # For Windows: rmdir /s /q node_modules & del package-lock.json
            npm install
            ```
        *   **Platform-Specific Dependencies:** Some packages might have dependencies that require build tools (like Python, C++ compilers). If installation fails on such packages, the error messages usually indicate missing system dependencies.

## 6. Running the Application

After setting up the database, Python scripts, and the Next.js application, you can run the full system.

1.  **Ensure MySQL/MariaDB server is running.**
    (Check your system's services or use `sudo systemctl status mariadb` / `sudo systemctl status mysql` on Linux).

2.  **Run the Python Scanner Script (`Python_Scanning/scan_bt.py`):**
    Open a **new terminal window/tab**.
    ```bash
    cd /path/to/Ubiquitous-Computing/Python_Scanning
    # Activate virtual environment if not already active in this terminal:
    # source ../.venv/bin/activate  (Linux/macOS, adjust path if needed)
    # ..\.venv\Scripts\activate    (Windows CMD, adjust path if needed)
    python scan_bt.py
    ```
    Keep this terminal open. It will continuously scan for Bluetooth devices and send data to the Next.js API.

3.  **Run the Python Data Seeder (`ubicomp-dashboard/seed_patterns.py`) (Optional):**
    If you want to populate or refresh the synthetic behavioral patterns, open **another new terminal window/tab**.
    ```bash
    cd /path/to/Ubiquitous-Computing/ubicomp-dashboard
    # Activate virtual environment if not already active in this terminal:
    # source ../.venv/bin/activate  (Linux/macOS, adjust path if needed)
    # ..\.venv\Scripts\activate    (Windows CMD, adjust path if needed)
    python seed_patterns.py
    ```
    This script runs once and then exits.

4.  **Start the Next.js Application Server:**
    Open **yet another new terminal window/tab**.
    ```bash
    cd /path/to/Ubiquitous-Computing/ubicomp-dashboard
    ```
    You have two main options to run the Next.js application:

    *   **A. Development Mode (`npm run dev`):**
        This is ideal for development and debugging.
        ```bash
        npm run dev
        ```
        *   **Features:**
            *   Starts a development server (usually on `http://localhost:3000`).
            *   Enables **Hot Module Replacement (HMR)**: Changes to your code (e.g., React components, API routes) are reflected in the browser almost instantly without a full page reload.
            *   Provides detailed error messages and source maps for easier debugging.
            *   Generally slower and uses more resources than a production build.
        *   Next.js will recompile your application when you save files. Environment variables from `.env.local` are loaded.

    *   **B. Production Mode (`npm run build` then `npm start`):**
        This is how you would run the application in a live/production environment.
        1.  **Build the Application:**
            ```bash
            npm run build
            ```
            *   This command creates an optimized production build of your application.
            *   It bundles your JavaScript, optimizes assets (images, CSS), and pre-renders pages where possible.
            *   The output is typically placed in a `.next` directory.
            *   Environment variables from `.env.local` (or other relevant `.env` files like `.env.production`) are baked into the build if they are used in a way that Next.js can statically analyze (e.g., `NEXT_PUBLIC_` variables).
        2.  **Start the Production Server:**
            ```bash
            npm start
            ```
            *   This command starts a Node.js server that serves the optimized build created by `npm run build`.
            *   It's much more performant and uses fewer resources than the development server.
            *   Does not have HMR; code changes require a new build and server restart.

5.  **Access the Dashboard:**
    Open your web browser and navigate to `http://localhost:3000` (or the port indicated in the terminal if it's different, e.g., if port 3000 was already in use).
