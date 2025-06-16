# Ubiquitous Computing Environment Monitor - Installation Guide

This guide provides detailed steps to set up and run the Ubiquitous Computing Environment Monitor project.

## 1. System Requirements

*   **Operating System:**
    *   **For Next.js Development & Hosting:** Linux, macOS, or Windows.
    *   **For Python Scanner (`scanner.py` with `bleak`):** Linux is highly recommended for full Bluetooth functionality and easier setup. macOS is possible. Windows may have limitations with `bleak` or require specific Bluetooth driver configurations.
*   **Software:**
    *   **Node.js:** LTS version (e.g., v18.x or v20.x). Download from [nodejs.org](https://nodejs.org/).
    *   **Python:** Version 3.8 or newer. Download from [python.org](https://python.org/).
    *   **MySQL Server:** Version 5.7 or newer (MariaDB is a compatible alternative).
    *   **Git:** For cloning the repository.
*   **Python Dependencies (for scanner & seeder):** `bleak`, `requests`, `mysql-connector-python`.
*   **Linux Bluetooth Libraries (for scanner):** `libbluetooth-dev`, `libglib2.0-dev` (or equivalent package names for your distribution).

## 2. Clone the Repository

Open your terminal or command prompt and run:

```bash
git clone <repository_url> # Replace <repository_url> with the actual URL
cd Ubiquitous-Computing # Or your chosen project directory name
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
5.  **Create Tables:**
    Log back into MySQL/MariaDB as `ubicomp_user`:
    ```bash
    mysql -u ubicomp_user -p dashboard
    ```
    (Enter the password for `ubicomp_user`).
    Then, execute the following SQL to create the necessary tables:

    ```sql
    CREATE TABLE device_sessions (
        pseudonym VARCHAR(12) NOT NULL,
        device_name VARCHAR(255) NOT NULL,
        signal_strength INT,
        scanner_location VARCHAR(100),
        major_class VARCHAR(50),
        last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (pseudonym, device_name, scanner_location) -- Composite key to allow same device from different scanners or if name changes slightly
    );

    CREATE TABLE synthetic_patterns (
        id INT AUTO_INCREMENT PRIMARY KEY,
        pseudonym VARCHAR(12) NOT NULL,
        device_name VARCHAR(255),
        pattern_type VARCHAR(50) NOT NULL, -- e.g., 'last_seen', 'cooccur', 'routine'
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_pattern (pseudonym, pattern_type, message(255)) -- Ensure message part is indexed for uniqueness
    );
    ```
    Type `EXIT;` to leave the MySQL prompt.

## 4. Python Scripts Setup

1.  **Navigate to Project Root:**
    If not already there, `cd /path/to/Ubiquitous-Computing`.
2.  **Create and Activate Python Virtual Environment:**
    ```bash
    python3 -m venv .venv
    source .venv/bin/activate  # On Linux/macOS
    # .venv\Scripts\activate   # On Windows
    ```
3.  **Install Python Dependencies:**
    Create a `requirements.txt` file in the project root with the following content:
    ```txt
    # requirements.txt
    bleak
    requests
    mysql-connector-python
    ```
    Then run:
    ```bash
    pip install -r requirements.txt
    ```
4.  **Configure Python Scripts:**
    *   **`seed_patterns.py`:**
        Open `seed_patterns.py` and update the `DB_CONF` dictionary with your MySQL credentials:
        ```python
        DB_CONF = dict(
            host="127.0.0.1",  # Or your MySQL host
            user="ubicomp_user",
            password="your_strong_password", # The password you set
            database="dashboard"
        )
        ```
    *   **`scanner.py`:**
        Open `scanner.py` and configure:
        *   `SERVER_URL`: Set to your Next.js API endpoint (default for local dev: `http://localhost:3000/api/device-log` or `http://192.168.X.X:3000/api/device-log` if Next.js is on a different machine but same network).
        *   `SESSION_KEY`: Choose a secret string. This **must** be the same as the one used in the Next.js API.
        ```python
        SERVER_URL = "http://localhost:3000/api/device-log" # Adjust if Next.js runs elsewhere
        SESSION_KEY = "your_chosen_secret_session_key_2025" # MUST MATCH Next.js API
        SCANNER_LOCATION = "Default_Scanner_Location" # Customize as needed
        ```

## 5. Next.js Application Setup (`ubicomp-dashboard`)

1.  **Navigate to Next.js Directory:**
    ```bash
    cd ubicomp-dashboard
    ```
2.  **Configure Database Connection:**
    Open `lib/db.js` and update the `pool` creation with your MySQL credentials:
    ```javascript
    // ubicomp-dashboard/lib/db.js
    import mysql from 'mysql2/promise';

    export const pool = mysql.createPool({
      host: '127.0.0.1', // Or your MySQL host
      user: 'ubicomp_user',
      password: 'your_strong_password', // The password you set
      database: 'dashboard',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
    ```
3.  **Configure Session Key for API:**
    Open `pages/api/device-log.js`. Find the line where `SESSION_KEY` is used for hashing the MAC address. Ensure this key matches the `SESSION_KEY` in `scanner.py`. It's recommended to use an environment variable for this.
    Modify `pages/api/device-log.js` to use an environment variable:
    ```javascript
    // ubicomp-dashboard/pages/api/device-log.js
    // ...
    const pseudonym = crypto
      .createHash('sha256')
      .update(mac + (process.env.SCANNER_SESSION_KEY || "default_fallback_key_if_not_set")) // Use environment variable
      .digest('hex')
      .slice(0, 12);
    // ...
    ```
    Then, create a `.env.local` file in the `ubicomp-dashboard` directory:
    ```env
    # ubicomp-dashboard/.env.local
    SCANNER_SESSION_KEY="your_chosen_secret_session_key_2025"
    ```
    **Important:** Make sure `your_chosen_secret_session_key_2025` is the exact same string used in `scanner.py`.
4.  **Install Node.js Dependencies:**
    ```bash
    npm install
    ```

## 6. Running the Application

1.  **Ensure MySQL/MariaDB server is running.**
2.  **Run the Python Scanner Script:**
    Open a new terminal, navigate to the project root, activate the virtual environment, and run:
    ```bash
    # (.venv) $ python scanner.py
    ```
    (On Linux, you might need `sudo python scanner.py` if you encounter permission issues with Bluetooth, or configure permissions appropriately.)
3.  **Run the Python Data Seeder (Optional - for initial data or to refresh synthetic patterns):**
    Open another terminal, navigate to the project root, activate the virtual environment, and run:
    ```bash
    # (.venv) $ python seed_patterns.py
    ```
4.  **Start the Next.js Development Server:**
    Open another terminal, navigate to the `ubicomp-dashboard` directory, and run:
    ```bash
    npm run dev
    ```
5.  **Access the Dashboard:**
    Open your web browser and go to `http://localhost:3000`.

## 7. Troubleshooting

*   **Database Connection Issues:** Double-check host, username, password, and database name in `lib/db.js` and Python scripts. Ensure the MySQL user has privileges for the `dashboard` database from `localhost` (or the host Next.js/Python scripts are connecting from).
*   **Python Dependencies:** Ensure the virtual environment is activated when running `pip install` and Python scripts.
*   **Bluetooth Scanner Permissions (Linux):** `bleak` might require root privileges or specific user group permissions (`bluetooth` group) and capabilities.
    *   Add user to bluetooth group: `sudo usermod -aG bluetooth $USER` (logout and login again).
*   **`SESSION_KEY` Mismatch:** If devices are logged but pseudonyms seem inconsistent or data doesn't link up, ensure `SESSION_KEY` is identical in `scanner.py` and `pages/api/device-log.js` (via `.env.local`).
*   **API Errors:** Check the terminal output where `npm run dev` is running for API error messages.
```


# Ubiquitous Computing Monitor - Raspberry Pi Setup Guide

This guide details how to set up the Ubiquitous Computing Environment Monitor project, specifically the Python scanner and potentially the Next.js server, on a Raspberry Pi.

## 1. Prerequisites for Raspberry Pi

*   Raspberry Pi (Model 3B+ or newer recommended for better performance).
*   Raspberry Pi OS (Legacy or latest, 32-bit or 64-bit). A fresh install is recommended.
*   SD Card (16GB or larger, Class 10).
*   Power supply for the Raspberry Pi.
*   Internet connectivity (Ethernet or Wi-Fi).
*   Keyboard, mouse, and monitor for initial setup (or SSH access).
*   Basic familiarity with the Linux terminal.

## 2. Initial Raspberry Pi Configuration

1.  **Flash Raspberry Pi OS:** Use Raspberry Pi Imager to flash the OS to your SD card.
2.  **Boot and Configure:**
    *   Complete the initial setup wizard (language, timezone, user password, Wi-Fi).
    *   Enable SSH and VNC (optional) via `sudo raspi-config` under "Interface Options" if you plan to operate it headless.
3.  **Update System:**
    Open a terminal and run:
    ```bash
    sudo apt update
    sudo apt full-upgrade -y
    sudo apt autoremove -y
    sudo reboot # Recommended after a major upgrade
    ```

## 3. Install Essential Software

1.  **Git:**
    ```bash
    sudo apt install git -y
    ```
2.  **Node.js and npm (for Next.js application):**
    We'll use NodeSource to install a recent LTS version (e.g., Node.js 18.x).
    ```bash
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    # Verify installation
    node -v
    npm -v
    ```
3.  **Python 3, pip, and venv:**
    Usually pre-installed. Ensure they are present and install `venv` if missing.
    ```bash
    sudo apt install python3 python3-pip python3-venv -y
    # Verify installation
    python3 --version
    pip3 --version
    ```
4.  **MariaDB Server (MySQL compatible):**
    MariaDB is often preferred on Raspberry Pi for its resource efficiency.
    ```bash
    sudo apt install mariadb-server -y
    sudo systemctl status mariadb # Check if it's running
    sudo mariadb-secure-installation # Follow prompts to set root password, remove anonymous users, etc.
    ```
5.  **Bluetooth Libraries and Tools:**
    Required for Python's `bleak` library and general Bluetooth functionality.
    ```bash
    sudo apt install bluetooth bluez libbluetooth-dev libglib2.0-dev -y
    # Add your user to the bluetooth group to run bleak without sudo (recommended)
    sudo usermod -aG bluetooth $USER
    echo "Bluetooth group membership updated. Please reboot or log out/in for changes to take effect."
    # After reboot/re-login, verify: groups $USER
    ```
    Ensure Bluetooth service is enabled and running:
    ```bash
    sudo systemctl enable bluetooth
    sudo systemctl start bluetooth
    sudo systemctl status bluetooth
    ```

## 4. Clone Repository and Project Setup

1.  **Clone the Project:**
    ```bash
    git clone <repository_url> ~/Ubiquitous-Computing # Or your preferred location
    cd ~/Ubiquitous-Computing
    ```
2.  **Database Setup (MariaDB):**
    Follow **Section 3 (Database Setup)** from the main `INSTALLATION_GUIDE.md`, using `sudo mariadb -u root -p` to log in as the MariaDB root user. The SQL commands for creating the database, user, and tables are the same.
3.  **Python Scripts Setup:**
    Follow **Section 4 (Python Scripts Setup)** from `INSTALLATION_GUIDE.md`.
    *   Remember to activate the virtual environment: `source .venv/bin/activate`.
    *   Install dependencies: `pip install -r requirements.txt`.
    *   Configure `seed_patterns.py` and `scanner.py` (especially `SERVER_URL` and `SESSION_KEY`). If running Next.js on the Pi itself, `SERVER_URL` in `scanner.py` will be `http://localhost:3000/api/device-log`.
4.  **Next.js Application Setup (`ubicomp-dashboard`):**
    Follow **Section 5 (Next.js Application Setup)** from `INSTALLATION_GUIDE.md`.
    *   Navigate to `~/Ubiquitous-Computing/ubicomp-dashboard`.
    *   Configure `lib/db.js` and `pages/api/device-log.js` (or `.env.local` for `SCANNER_SESSION_KEY`).
    *   Install dependencies: `npm install`. This might take some time on a Raspberry Pi.

## 5. Running the Application on Raspberry Pi

1.  **Ensure MariaDB is running:**
    ```bash
    sudo systemctl start mariadb
    ```
2.  **Run the Python Scanner Script:**
    Open a new terminal (or use a terminal multiplexer like `tmux` or `screen` for long-running processes).
    ```bash
    cd ~/Ubiquitous-Computing
    source .venv/bin/activate
    python3 scanner.py
    ```
    If you didn't add your user to the `bluetooth` group and reboot, you might need `sudo python3 scanner.py`.
3.  **Run the Python Data Seeder (Optional):**
    In another terminal:
    ```bash
    cd ~/Ubiquitous-Computing
    source .venv/bin/activate
    python3 seed_patterns.py
    ```
4.  **Run the Next.js Application:**
    In another terminal:
    ```bash
    cd ~/Ubiquitous-Computing/ubicomp-dashboard
    npm run dev
    ```
    Access from a browser on another device on the same network: `http://<raspberry_pi_ip_address>:3000`. Find your Pi's IP with `hostname -I`.

    For a more "production-like" setup on the Pi (which is more resource-efficient than `npm run dev`):
    ```bash
    npm run build
    npm start
    ```

## 6. (Optional) Running Scripts on Boot with `systemd`

For a more permanent setup where the scanner and Next.js app start on boot:

1.  **Scanner Service (`scanner.service`):**
    Create `/etc/systemd/system/ubicomp-scanner.service`:
    ```ini
    [Unit]
    Description=Ubiquitous Computing Bluetooth Scanner
    After=network.target bluetooth.service mariadb.service

    [Service]
    ExecStart=/home/pi/Ubiquitous-Computing/.venv/bin/python3 /home/pi/Ubiquitous-Computing/scanner.py
    WorkingDirectory=/home/pi/Ubiquitous-Computing
    StandardOutput=inherit
    StandardError=inherit
    Restart=always
    User=pi # Or your username

    [Install]
    WantedBy=multi-user.target
    ```
    Replace `pi` with your actual username if different. Adjust paths if necessary.

2.  **Next.js App Service (`nextapp.service`):**
    Create `/etc/systemd/system/ubicomp-nextapp.service`:
    ```ini
    [Unit]
    Description=Ubiquitous Computing Next.js Dashboard
    After=network.target mariadb.service

    [Service]
    Environment="NODE_ENV=production"
    Environment="SCANNER_SESSION_KEY=your_chosen_secret_session_key_2025" # Set env var here
    ExecStart=/usr/bin/npm start --prefix /home/pi/Ubiquitous-Computing/ubicomp-dashboard
    WorkingDirectory=/home/pi/Ubiquitous-Computing/ubicomp-dashboard
    StandardOutput=inherit
    StandardError=inherit
    Restart=always
    User=pi # Or your username

    [Install]
    WantedBy=multi-user.target
    ```
    Ensure you have run `npm run build` in `~/Ubiquitous-Computing/ubicomp-dashboard` first.
    Update `SCANNER_SESSION_KEY` to your actual key.

3.  **Enable and Start Services:**
    ```bash
    sudo systemctl daemon-reload
    sudo systemctl enable ubicomp-scanner.service
    sudo systemctl start ubicomp-scanner.service
    sudo systemctl status ubicomp-scanner.service

    sudo systemctl enable ubicomp-nextapp.service
    sudo systemctl start ubicomp-nextapp.service
    sudo systemctl status ubicomp-nextapp.service
    ```

This setup allows the project components to run automatically when your Raspberry Pi boots up.
```// filepath: RASPBERRY_PI_SETUP.md
# Ubiquitous Computing Monitor - Raspberry Pi Setup Guide

This guide details how to set up the Ubiquitous Computing Environment Monitor project, specifically the Python scanner and potentially the Next.js server, on a Raspberry Pi.

## 1. Prerequisites for Raspberry Pi

*   Raspberry Pi (Model 3B+ or newer recommended for better performance).
*   Raspberry Pi OS (Legacy or latest, 32-bit or 64-bit). A fresh install is recommended.
*   SD Card (16GB or larger, Class 10).
*   Power supply for the Raspberry Pi.
*   Internet connectivity (Ethernet or Wi-Fi).
*   Keyboard, mouse, and monitor for initial setup (or SSH access).
*   Basic familiarity with the Linux terminal.

## 2. Initial Raspberry Pi Configuration

1.  **Flash Raspberry Pi OS:** Use Raspberry Pi Imager to flash the OS to your SD card.
2.  **Boot and Configure:**
    *   Complete the initial setup wizard (language, timezone, user password, Wi-Fi).
    *   Enable SSH and VNC (optional) via `sudo raspi-config` under "Interface Options" if you plan to operate it headless.
3.  **Update System:**
    Open a terminal and run:
    ```bash
    sudo apt update
    sudo apt full-upgrade -y
    sudo apt autoremove -y
    sudo reboot # Recommended after a major upgrade
    ```

## 3. Install Essential Software

1.  **Git:**
    ```bash
    sudo apt install git -y
    ```
2.  **Node.js and npm (for Next.js application):**
    We'll use NodeSource to install a recent LTS version (e.g., Node.js 18.x).
    ```bash
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    # Verify installation
    node -v
    npm -v
    ```
3.  **Python 3, pip, and venv:**
    Usually pre-installed. Ensure they are present and install `venv` if missing.
    ```bash
    sudo apt install python3 python3-pip python3-venv -y
    # Verify installation
    python3 --version
    pip3 --version
    ```
4.  **MariaDB Server (MySQL compatible):**
    MariaDB is often preferred on Raspberry Pi for its resource efficiency.
    ```bash
    sudo apt install mariadb-server -y
    sudo systemctl status mariadb # Check if it's running
    sudo mariadb-secure-installation # Follow prompts to set root password, remove anonymous users, etc.
    ```
5.  **Bluetooth Libraries and Tools:**
    Required for Python's `bleak` library and general Bluetooth functionality.
    ```bash
    sudo apt install bluetooth bluez libbluetooth-dev libglib2.0-dev -y
    # Add your user to the bluetooth group to run bleak without sudo (recommended)
    sudo usermod -aG bluetooth $USER
    echo "Bluetooth group membership updated. Please reboot or log out/in for changes to take effect."
    # After reboot/re-login, verify: groups $USER
    ```
    Ensure Bluetooth service is enabled and running:
    ```bash
    sudo systemctl enable bluetooth
    sudo systemctl start bluetooth
    sudo systemctl status bluetooth
    ```

## 4. Clone Repository and Project Setup

1.  **Clone the Project:**
    ```bash
    git clone <repository_url> ~/Ubiquitous-Computing # Or your preferred location
    cd ~/Ubiquitous-Computing
    ```
2.  **Database Setup (MariaDB):**
    Follow **Section 3 (Database Setup)** from the main `INSTALLATION_GUIDE.md`, using `sudo mariadb -u root -p` to log in as the MariaDB root user. The SQL commands for creating the database, user, and tables are the same.
3.  **Python Scripts Setup:**
    Follow **Section 4 (Python Scripts Setup)** from `INSTALLATION_GUIDE.md`.
    *   Remember to activate the virtual environment: `source .venv/bin/activate`.
    *   Install dependencies: `pip install -r requirements.txt`.
    *   Configure `seed_patterns.py` and `scanner.py` (especially `SERVER_URL` and `SESSION_KEY`). If running Next.js on the Pi itself, `SERVER_URL` in `scanner.py` will be `http://localhost:3000/api/device-log`.
4.  **Next.js Application Setup (`ubicomp-dashboard`):**
    Follow **Section 5 (Next.js Application Setup)** from `INSTALLATION_GUIDE.md`.
    *   Navigate to `~/Ubiquitous-Computing/ubicomp-dashboard`.
    *   Configure `lib/db.js` and `pages/api/device-log.js` (or `.env.local` for `SCANNER_SESSION_KEY`).
    *   Install dependencies: `npm install`. This might take some time on a Raspberry Pi.

## 5. Running the Application on Raspberry Pi

1.  **Ensure MariaDB is running:**
    ```bash
    sudo systemctl start mariadb
    ```
2.  **Run the Python Scanner Script:**
    Open a new terminal (or use a terminal multiplexer like `tmux` or `screen` for long-running processes).
    ```bash
    cd ~/Ubiquitous-Computing
    source .venv/bin/activate
    python3 scanner.py
    ```
    If you didn't add your user to the `bluetooth` group and reboot, you might need `sudo python3 scanner.py`.
3.  **Run the Python Data Seeder (Optional):**
    In another terminal:
    ```bash
    cd ~/Ubiquitous-Computing
    source .venv/bin/activate
    python3 seed_patterns.py
    ```
4.  **Run the Next.js Application:**
    In another terminal:
    ```bash
    cd ~/Ubiquitous-Computing/ubicomp-dashboard
    npm run dev
    ```
    Access from a browser on another device on the same network: `http://<raspberry_pi_ip_address>:3000`. Find your Pi's IP with `hostname -I`.

    For a more "production-like" setup on the Pi (which is more resource-efficient than `npm run dev`):
    ```bash
    npm run build
    npm start
    ```

## 6. (Optional) Running Scripts on Boot with `systemd`

For a more permanent setup where the scanner and Next.js app start on boot:

1.  **Scanner Service (`scanner.service`):**
    Create `/etc/systemd/system/ubicomp-scanner.service`:
    ```ini
    [Unit]
    Description=Ubiquitous Computing Bluetooth Scanner
    After=network.target bluetooth.service mariadb.service

    [Service]
    ExecStart=/home/pi/Ubiquitous-Computing/.venv/bin/python3 /home/pi/Ubiquitous-Computing/scanner.py
    WorkingDirectory=/home/pi/Ubiquitous-Computing
    StandardOutput=inherit
    StandardError=inherit
    Restart=always
    User=pi # Or your username

    [Install]
    WantedBy=multi-user.target
    ```
    Replace `pi` with your actual username if different. Adjust paths if necessary.

2.  **Next.js App Service (`nextapp.service`):**
    Create `/etc/systemd/system/ubicomp-nextapp.service`:
    ```ini
    [Unit]
    Description=Ubiquitous Computing Next.js Dashboard
    After=network.target mariadb.service

    [Service]
    Environment="NODE_ENV=production"
    Environment="SCANNER_SESSION_KEY=your_chosen_secret_session_key_2025" # Set env var here
    ExecStart=/usr/bin/npm start --prefix /home/pi/Ubiquitous-Computing/ubicomp-dashboard
    WorkingDirectory=/home/pi/Ubiquitous-Computing/ubicomp-dashboard
    StandardOutput=inherit
    StandardError=inherit
    Restart=always
    User=pi # Or your username

    [Install]
    WantedBy=multi-user.target
    ```
    Ensure you have run `npm run build` in `~/Ubiquitous-Computing/ubicomp-dashboard` first.
    Update `SCANNER_SESSION_KEY` to your actual key.

3.  **Enable and Start Services:**
    ```bash
    sudo systemctl daemon-reload
    sudo systemctl enable ubicomp-scanner.service
    sudo systemctl start ubicomp-scanner.service
    sudo systemctl status ubicomp-scanner.service

    sudo systemctl enable ubicomp-nextapp.service
    sudo systemctl start ubicomp-nextapp.service
    sudo systemctl status ubicomp-nextapp.service
    ```

This setup allows the project components to run automatically when your Raspberry Pi boots up.