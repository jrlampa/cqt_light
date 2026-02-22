import sqlite3
import os
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent
DB_PATH = BASE_DIR / "frontend" / "cqt_light.db"

def migrate():
    if not DB_PATH.exists():
        print(f"Error: DB not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        print("Adding ciclo_manutencao_meses...")
        cursor.execute("ALTER TABLE materiais ADD COLUMN ciclo_manutencao_meses INTEGER DEFAULT 24")
    except sqlite3.OperationalError as e:
        print(f"  Note: {e}")

    try:
        print("Adding vida_util_anos...")
        cursor.execute("ALTER TABLE materiais ADD COLUMN vida_util_anos INTEGER DEFAULT 30")
    except sqlite3.OperationalError as e:
        print(f"  Note: {e}")

    conn.commit()
    conn.close()
    print("✅ Migration applied.")

if __name__ == "__main__":
    migrate()
