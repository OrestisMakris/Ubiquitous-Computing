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
