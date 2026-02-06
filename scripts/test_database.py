"""
CQT Light V3 - Backend Database Tests
Tests the database layer to ensure all queries work correctly.
"""

import sqlite3
import time
from pathlib import Path

DB_PATH = Path(__file__).parent.parent / "frontend" / "cqt_light.db"

def run_tests():
    print("\n" + "=" * 60)
    print("🧪 CQT Light V3 - Database Test Suite")
    print("=" * 60)
    print(f"Database: {DB_PATH}\n")
    
    if not DB_PATH.exists():
        print("❌ Database not found!")
        return False
    
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    results = []
    
    def test(name, condition, details=""):
        results.append((name, condition))
        status = "✅" if condition else "❌"
        print(f"{status} {name}{': ' + details if details else ''}")
    
    # Test 1: Tables exist
    try:
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = [row[0] for row in cursor.fetchall()]
        expected = ['materiais', 'servicos_cm', 'kits', 'kit_composicao']
        missing = [t for t in expected if t not in tables]
        test("T1: All tables exist", len(missing) == 0, f"Found: {tables}")
    except Exception as e:
        test("T1: All tables exist", False, str(e))
    
    # Test 2: Materiais populated
    try:
        cursor.execute("SELECT COUNT(*) FROM materiais")
        count = cursor.fetchone()[0]
        test("T2: Materiais populated", count > 1000, f"{count:,} materials")
    except Exception as e:
        test("T2: Materiais populated", False, str(e))
    
    # Test 3: Kits populated
    try:
        cursor.execute("SELECT COUNT(*) FROM kits")
        count = cursor.fetchone()[0]
        test("T3: Kits populated", count > 100, f"{count:,} kits")
    except Exception as e:
        test("T3: Kits populated", False, str(e))
    
    # Test 4: Kit compositions exist
    try:
        cursor.execute("SELECT COUNT(*) FROM kit_composicao")
        count = cursor.fetchone()[0]
        test("T4: Kit compositions exist", count > 100, f"{count:,} compositions")
    except Exception as e:
        test("T4: Kit compositions exist", False, str(e))
    
    # Test 5: Servicos CM populated
    try:
        cursor.execute("SELECT COUNT(*) FROM servicos_cm")
        count = cursor.fetchone()[0]
        test("T5: Servicos CM populated", count > 10, f"{count:,} services")
    except Exception as e:
        test("T5: Servicos CM populated", False, str(e))
    
    # Test 6: Search query works
    try:
        cursor.execute("""
            SELECT codigo_kit, descricao_kit FROM kits 
            WHERE codigo_kit LIKE ? OR descricao_kit LIKE ?
            LIMIT 10
        """, ('%P11%', '%P11%'))
        results_search = cursor.fetchall()
        test("T6: Poste search works", len(results_search) > 0, f"Found {len(results_search)} for 'P11'")
    except Exception as e:
        test("T6: Poste search works", False, str(e))
    
    # Test 7: Structure search works  
    try:
        cursor.execute("""
            SELECT codigo_kit, descricao_kit FROM kits 
            WHERE codigo_kit LIKE ? LIMIT 10
        """, ('%13N%',))
        results_search = cursor.fetchall()
        test("T7: Structure search works", len(results_search) > 0, f"Found {len(results_search)} for '13N'")
    except Exception as e:
        test("T7: Structure search works", False, str(e))
    
    # Test 8: Aggregated cost query (performance test)
    try:
        start = time.perf_counter()
        kit_codes = ['13N1', 'M1', 'CE1']  # Sample kits
        placeholders = ','.join(['?' for _ in kit_codes])
        
        cursor.execute(f"""
            SELECT 
                m.sap,
                m.descricao,
                m.unidade,
                m.preco_unitario,
                SUM(kc.quantidade) as quantidade,
                SUM(kc.quantidade * m.preco_unitario) as subtotal
            FROM kit_composicao kc
            JOIN materiais m ON kc.sap = m.sap
            WHERE kc.codigo_kit IN ({placeholders})
            GROUP BY m.sap
            ORDER BY m.descricao
        """, kit_codes)
        
        materials = cursor.fetchall()
        elapsed = (time.perf_counter() - start) * 1000
        test("T8: Aggregated query performance", elapsed < 100, f"{elapsed:.1f}ms for {len(materials)} materials")
    except Exception as e:
        test("T8: Aggregated query performance", False, str(e))
    
    # Test 9: Material prices exist
    try:
        cursor.execute("SELECT COUNT(*) FROM materiais WHERE preco_unitario > 0")
        count = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM materiais")
        total = cursor.fetchone()[0]
        pct = (count / total * 100) if total > 0 else 0
        test("T9: Materials have prices", pct > 50, f"{count:,}/{total:,} ({pct:.1f}%)")
    except Exception as e:
        test("T9: Materials have prices", False, str(e))
    
    # Test 10: Indexes exist
    try:
        cursor.execute("SELECT name FROM sqlite_master WHERE type='index'")
        indexes = [row[0] for row in cursor.fetchall()]
        has_indexes = len([i for i in indexes if not i.startswith('sqlite_')]) > 0
        test("T10: Indexes configured", has_indexes, f"{len(indexes)} indexes")
    except Exception as e:
        test("T10: Indexes configured", False, str(e))
    
    conn.close()
    
    # Summary
    print("\n" + "=" * 60)
    passed = sum(1 for _, ok in results if ok)
    total = len(results)
    print(f"📊 Results: {passed}/{total} tests passed ({passed/total*100:.0f}%)")
    
    if passed == total:
        print("🎉 All database tests passed!")
        return True
    else:
        print("⚠️ Some tests failed. Review the output above.")
        return False


if __name__ == "__main__":
    run_tests()
