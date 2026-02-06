"""
CQT Light V2 - Database Seeder
Imports data from JSON files into SQLite database.

Sources:
- data/catalog/material_catalog.json -> materiais table
- data/kits/kits.json -> kits + kit_composicao tables
"""

import json
import sqlite3
import os
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / "data"
DB_PATH = BASE_DIR / "frontend" / "cqt_light.db"

MATERIAL_CATALOG = DATA_DIR / "catalog" / "material_catalog.json"
KITS_FILE = DATA_DIR / "kits" / "kits.json"


def init_database(conn):
    """Create tables if they don't exist."""
    cursor = conn.cursor()
    
    # Read schema
    schema_path = BASE_DIR / "frontend" / "electron" / "db" / "schema.sql"
    if schema_path.exists():
        schema = schema_path.read_text(encoding='utf-8')
        cursor.executescript(schema)
        conn.commit()
        print(f"✅ Schema applied from {schema_path}")
    else:
        print(f"⚠️ Schema file not found at {schema_path}")


def import_materials(conn):
    """Import materials from material_catalog.json."""
    if not MATERIAL_CATALOG.exists():
        print(f"⚠️ Material catalog not found: {MATERIAL_CATALOG}")
        return
    
    with open(MATERIAL_CATALOG, 'r', encoding='utf-8') as f:
        catalog = json.load(f)
    
    cursor = conn.cursor()
    count = 0
    
    for sap, data in catalog.items():
        try:
            cursor.execute("""
                INSERT INTO materiais (sap, descricao, unidade, preco_unitario)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(sap) DO UPDATE SET
                    descricao = excluded.descricao,
                    unidade = excluded.unidade,
                    preco_unitario = excluded.preco_unitario
            """, (
                str(sap),
                data.get('description', ''),
                data.get('unit', 'UN'),
                float(data.get('price', 0))
            ))
            count += 1
        except Exception as e:
            print(f"  ⚠️ Error importing SAP {sap}: {e}")
    
    conn.commit()
    print(f"✅ Imported {count} materials")


def import_kits(conn):
    """Import kits and compositions from kits.json."""
    if not KITS_FILE.exists():
        print(f"⚠️ Kits file not found: {KITS_FILE}")
        return
    
    with open(KITS_FILE, 'r', encoding='utf-8') as f:
        kits = json.load(f)
    
    cursor = conn.cursor()
    kit_count = 0
    comp_count = 0
    
    for codigo_kit, data in kits.items():
        try:
            # Insert kit
            descricao = data.get('name', codigo_kit)
            cursor.execute("""
                INSERT INTO kits (codigo_kit, descricao_kit)
                VALUES (?, ?)
                ON CONFLICT(codigo_kit) DO UPDATE SET descricao_kit = excluded.descricao_kit
            """, (codigo_kit, descricao))
            kit_count += 1
            
            # Insert composition
            materials = data.get('materials', [])
            for mat in materials:
                sap = str(mat.get('sap', ''))
                qty = float(mat.get('qty', 1))
                
                if sap:
                    cursor.execute("""
                        INSERT INTO kit_composicao (codigo_kit, sap, quantidade)
                        VALUES (?, ?, ?)
                        ON CONFLICT(codigo_kit, sap) DO UPDATE SET quantidade = excluded.quantidade
                    """, (codigo_kit, sap, qty))
                    comp_count += 1
                    
        except Exception as e:
            print(f"  ⚠️ Error importing kit {codigo_kit}: {e}")
    
    conn.commit()
    print(f"✅ Imported {kit_count} kits with {comp_count} composition entries")


def show_stats(conn):
    """Display database statistics."""
    cursor = conn.cursor()
    
    cursor.execute("SELECT COUNT(*) FROM materiais")
    mat_count = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM kits")
    kit_count = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM kit_composicao")
    comp_count = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM mao_de_obra")
    mo_count = cursor.fetchone()[0]
    
    print("\n📊 Database Stats:")
    print(f"   Materiais:      {mat_count:,}")
    print(f"   Kits:           {kit_count:,}")
    print(f"   Composições:    {comp_count:,}")
    print(f"   Mão de Obra:    {mo_count:,}")


def main():
    print("=" * 50)
    print("CQT Light V2 - Database Seeder")
    print("=" * 50)
    print(f"\nDatabase: {DB_PATH}")
    print(f"Materials: {MATERIAL_CATALOG}")
    print(f"Kits: {KITS_FILE}\n")
    
    # Connect to database
    conn = sqlite3.connect(DB_PATH)
    
    try:
        # Initialize schema
        init_database(conn)
        
        # Import data
        print("\n📦 Importing Materials...")
        import_materials(conn)
        
        print("\n🔧 Importing Kits...")
        import_kits(conn)
        
        # Show stats
        show_stats(conn)
        
        print("\n✅ Seed complete!")
        
    finally:
        conn.close()


if __name__ == "__main__":
    main()
