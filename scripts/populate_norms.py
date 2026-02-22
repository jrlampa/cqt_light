import sqlite3
import json
import os
from pathlib import Path

# Configurações
DB_PATH = Path(r'c:\myworld\cqt_light\frontend\cqt_light.db')
MINING_RESULTS_PATH = Path(r'c:\myworld\cqt_light\data\standards\mining_results.json')

def populate_norms():
    if not MINING_RESULTS_PATH.exists():
        print(f"Mining results not found: {MINING_RESULTS_PATH}")
        return

    with open(MINING_RESULTS_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)

    if not DB_PATH.exists():
        print(f"Database not found: {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    print(f"Using DB: {DB_PATH}")

    # Limpar referências atuais
    try:
        cursor.execute("DELETE FROM normas_referencia")
    except sqlite3.OperationalError:
        print("Table 'normas_referencia' might not exist yet. Ensure schema.sql was applied.")
        # Try to create it just in case, though schema.sql should have done it
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS normas_referencia (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sap TEXT NOT NULL,
                fonte TEXT NOT NULL,
                pagina INTEGER,
                contexto TEXT,
                data_indexacao DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_normas_sap ON normas_referencia(sap)")

    # Inserir dados
    count = 0
    for item in data.get('details', []):
        cursor.execute("""
            INSERT INTO normas_referencia (sap, fonte, pagina, contexto)
            VALUES (?, ?, ?, ?)
        """, (item['sap'], item['source'], item['page'], item['context']))
        count += 1

    conn.commit()
    conn.close()

    print(f"Successfully populated {count} normative references.")

if __name__ == "__main__":
    populate_norms()
