import sqlite3
import json
import os

db_path = 'technical_data.db'
json_path = 'final_technical_discovery.json'

def migrate():
    if not os.path.exists(json_path):
        print(f"Error: {json_path} not found.")
        return

    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Create Tables
    print("Creating tables...")
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS cables (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            r_ohm_km REAL,
            x_ohm_km REAL,
            coef_queda REAL,
            type TEXT -- 'BT', 'MT', 'MMX', etc.
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS transformers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            kva REAL NOT NULL,
            impedance_pct REAL DEFAULT 3.5,
            v_prim REAL,
            v_sec REAL DEFAULT 220,
            v_sec_neutral REAL DEFAULT 127
        )
    ''')

    # Insert Cable Data
    print("Migrating cables...")
    # Using 'coef_unitario_full' as source for cable data
    cables_source = data.get('coef_unitario_full', [])
    for entry in cables_source:
        name = entry.get('Unnamed: 1')
        if not name or name == 'Cabos': continue
        
        cursor.execute('''
            INSERT INTO cables (name, r_ohm_km, x_ohm_km, coef_queda, type)
            VALUES (?, ?, ?, ?, ?)
        ''', (
            name,
            entry.get('Unnamed: 2'),
            entry.get('Unnamed: 3'),
            entry.get('Unnamed: 4'),
            'BT' if 'QX' in name or 'AA' in name else 'Other'
        ))

    # Insert Transformer Data
    print("Migrating transformers...")
    standard_ratings = [30, 45, 75, 112.5, 150, 300, 500]
    for kva in standard_ratings:
        cursor.execute('''
            INSERT INTO transformers (kva, impedance_pct, v_prim, v_sec, v_sec_neutral)
            VALUES (?, ?, ?, ?, ?)
        ''', (kva, 3.5, 13800, 220, 127))

    conn.commit()
    conn.close()
    print(f"Migration complete. Database saved to {db_path}")

if __name__ == "__main__":
    migrate()
