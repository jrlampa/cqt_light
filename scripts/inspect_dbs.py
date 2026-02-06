import sqlite3
import json

def inspect_db(db_path):
    print(f"--- Inspecting {db_path} ---")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    for table_name in tables:
        name = table_name[0]
        print(f"\nTable: {name}")
        cursor.execute(f"PRAGMA table_info({name});")
        print("Columns:", cursor.fetchall())
        cursor.execute(f"SELECT * FROM {name} LIMIT 5;")
        print("Data (5 rows):", cursor.fetchall())
    conn.close()

inspect_db('data/technical_data.db')
inspect_db('data/database_completo.db')
