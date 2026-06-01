import os, subprocess, requests, time
from datetime import datetime

DB_NAME = "ereftx"
DB_USER = "root"
BOT_TOKEN = "8249015791:AAH6UtpbrYg6PnBZh19ook9uexGX_R4ZtwU"
CHAT_ID = "6354054316"
WAIT_TIME = 86400

def send_backup():
    now = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f"backup_{DB_NAME}_{now}.sql"
    
    try:
        # Create the dump with flags to skip problematic stats
        cmd = f"mysqldump -u {DB_USER} --column-statistics=0 --no-tablespaces {DB_NAME} > {filename}"
        subprocess.run(cmd, shell=True, check=True)
        
        # Read the file and force-replace the collation and add foreign key fixes
        with open(filename, 'r', encoding='utf-8', errors='ignore') as f:
            lines = f.readlines()
            
        with open(filename, 'w', encoding='utf-8') as f:
            f.write("SET FOREIGN_KEY_CHECKS=0;\n") # Force disable FK
            for line in lines:
                # Replace the modern collation with one XAMPP understands
                new_line = line.replace('utf8mb4_0900_ai_ci', 'utf8mb4_general_ci')
                new_line = new_line.replace('utf8mb4_0900_bin', 'utf8mb4_bin')
                f.write(new_line)
            f.write("\nSET FOREIGN_KEY_CHECKS=1;") # Re-enable FK

        # Send to Telegram
        url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendDocument"
        with open(filename, 'rb') as f:
            requests.post(url, data={'chat_id': CHAT_ID, 'caption': f"🚀 PRO BACKUP: {now}"}, files={'document': f})
        
        print(f"✅ Success: {filename} sent.")
        os.remove(filename)
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    while True:
        send_backup()
        time.sleep(WAIT_TIME)
