import unittest
import json
import csv
from pathlib import Path
import tempfile
import sqlite3

class TestBimExportLogic(unittest.TestCase):
    def setUp(self):
        self.test_dir = Path(tempfile.mkdtemp())
        self.db_path = self.test_dir / "test.db"
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("CREATE TABLE materiais (sap TEXT PRIMARY KEY, descricao TEXT, unidade TEXT, preco_unitario REAL)")
        cursor.execute("CREATE TABLE normas_referencia (sap TEXT, fonte TEXT, pagina TEXT, contexto TEXT)")
        cursor.execute("INSERT INTO materiais VALUES ('123', 'TEST MATERIAL', 'UN', 10.5)")
        cursor.execute("INSERT INTO normas_referencia VALUES ('123', 'NBR 123', '10', 'Context')")
        conn.commit()
        conn.close()

    def test_data_structure(self):
        # Simulating the query from export_bim.py
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        query = """
        SELECT 
            m.sap, 
            m.descricao, 
            m.unidade, 
            m.preco_unitario as custo_un,
            GROUP_CONCAT(n.fonte || ' (Pag ' || n.pagina || ')', ' | ') as normas
        FROM materiais m
        LEFT JOIN normas_referencia n ON m.sap = n.sap
        GROUP BY m.sap
        """
        rows = cursor.execute(query).fetchall()
        data = [dict(row) for row in rows]
        conn.close()

        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['sap'], '123')
        self.assertEqual(data[0]['normas'], 'NBR 123 (Pag 10)')

if __name__ == '__main__':
    unittest.main()
