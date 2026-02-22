import sqlite3
import pandas as pd
from pathlib import Path

# Configurações Dinâmicas
BASE_DIR = Path(__file__).parent.parent
DB_PATH = BASE_DIR / "frontend" / "cqt_light.db"
OUTPUT_CSV = BASE_DIR / "data" / "audit" / "zero_price_materials.csv"

def audit_zero_prices():
    if not DB_PATH.exists():
        print(f"Database not found: {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    
    # 1. Count Total vs Zero Price Materials
    total_materials = conn.execute("SELECT count(*) FROM materiais").fetchone()[0]
    zero_materials_count = conn.execute("SELECT count(*) FROM materiais WHERE preco_unitario = 0 OR preco_unitario IS NULL").fetchone()[0]
    
    # 2. Count Total vs Zero Service Kits
    total_kits = conn.execute("SELECT count(*) FROM kits").fetchone()[0]
    zero_service_kits = conn.execute("SELECT count(*) FROM kits WHERE custo_servico = 0 OR custo_servico IS NULL").fetchone()[0]
    
    print(f"\n--- AUDIT RESULTS ---")
    print(f"Materials: {zero_materials_count} / {total_materials} with zero price ({zero_materials_count/total_materials*100:.1f}%)")
    print(f"Kits: {zero_service_kits} / {total_kits} with zero service cost ({zero_service_kits/total_kits*100:.1f}%)")
    
    # 3. Export Zero Price Materials
    if zero_materials_count > 0:
        query = "SELECT sap, descricao, unidade, preco_unitario FROM materiais WHERE preco_unitario = 0 OR preco_unitario IS NULL"
        df = pd.read_sql_query(query, conn)
        
        OUTPUT_CSV.parent.mkdir(parents=True, exist_ok=True)
        df.to_csv(OUTPUT_CSV, index=False, sep=';', encoding='utf-8-sig') # Excel friendly format
        print(f"\nSaved list of {len(df)} zero-price materials to: {OUTPUT_CSV}")
        
        print("\n--- SAMPLE (First 5) ---")
        print(df.head(5).to_string(index=False))

    conn.close()

if __name__ == "__main__":
    audit_zero_prices()
