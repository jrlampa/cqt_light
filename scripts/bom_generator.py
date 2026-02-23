import json
import os
import sys
import sqlite3
import logging
from typing import List, Dict, Any

class BOMConsolidationEngine:
    """
    Enterprise BOM Generator for CQT LIGHT (MER Hardened).
    Integrates directly with SQLite for real-time relational logic.
    """

    def __init__(self):
        self.base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.db_path = os.path.join(self.base_dir, 'cqt_light.db')

    def _get_connection(self):
        return sqlite3.connect(self.db_path)

    def consolidate_project(self, project: Dict[str, Any]) -> Dict[str, Any]:
        """
        Processes project data into consolidated Materials and Labor reports.
        """
        bom_map: Dict[str, Dict[str, Any]] = {}
        labor_map: Dict[str, Dict[str, Any]] = {}
        
        conn = self._get_connection()
        cursor = conn.cursor()

        try:
            # 1. Process Assemblies/Structures (Kits)
            assemblies = project.get("estruturas", project.get("structures", []))
            for assembly in assemblies:
                kit_code = assembly.get("codigoKit", assembly.get("codigo_kit"))
                qty_multiplier = assembly.get("quantidade", 1)
                
                # Manual Material Overrides (Extras)
                extras = assembly.get("materiaisExtras", [])

                # Get standard composition via MER JOIN
                cursor.execute("""
                    SELECT m.sap, m.descricao, m.unidade, m.preco_unitario, kc.quantidade
                    FROM kit_composicao kc
                    JOIN materiais m ON kc.sap = m.sap
                    WHERE kc.codigo_kit = ?
                """, (kit_code,))
                
                standard_items = cursor.fetchall()
                for sap, desc, unit, price, kit_qty in standard_items:
                    self._add_to_bom(bom_map, sap, desc, unit, price, kit_qty * qty_multiplier)
                    self._add_labor_if_exists(cursor, labor_map, sap, kit_qty * qty_multiplier)

                # Process Extras
                for extra in extras:
                    sap = extra.get("sap", extra.get("codigo"))
                    qty = extra.get("quantidade", 1)
                    cursor.execute("SELECT descricao, unidade, preco_unitario FROM materiais WHERE sap = ?", (sap,))
                    m_row = cursor.fetchone()
                    if m_row:
                        self._add_to_bom(bom_map, sap, m_row[0], m_row[1], m_row[2], qty * qty_multiplier)
                        self._add_labor_if_exists(cursor, labor_map, sap, qty * qty_multiplier)

            # 2. Process Loose Materials
            loose_items = project.get("materiaisAvulsos", project.get("looseMaterials", []))
            for item in loose_items:
                sap = item.get("sap")
                qty = item.get("quantidade", 1)
                cursor.execute("SELECT descricao, unidade, preco_unitario FROM materiais WHERE sap = ?", (sap,))
                m_row = cursor.fetchone()
                if m_row:
                    self._add_to_bom(bom_map, sap, m_row[0], m_row[1], m_row[2], qty)
                    self._add_labor_if_exists(cursor, labor_map, sap, qty)

            return {
                "materials": list(bom_map.values()),
                "labor": list(labor_map.values()),
                "summary": {
                    "totalMaterial": sum(x['subtotal'] for x in bom_map.values()),
                    "totalLaborTime": sum(x['total_time'] for x in labor_map.values())
                }
            }

        finally:
            conn.close()

    def _add_to_bom(self, bom_map, sap, desc, unit, price, qty):
        if sap in bom_map:
            bom_map[sap]["quantidade"] += qty
            bom_map[sap]["subtotal"] = bom_map[sap]["quantidade"] * bom_map[sap]["preco_unitario"]
        else:
            bom_map[sap] = {
                "sap": sap,
                "descricao": desc,
                "unidade": unit,
                "preco_unitario": price or 0,
                "quantidade": qty,
                "subtotal": qty * (price or 0)
            }

    def _add_labor_if_exists(self, cursor, labor_map, sap, qty):
        """Cross-reference with DIM_TAREFA_OPERACAO"""
        cursor.execute("SELECT codigo_tarefa, descricao_operacao, tempo_estimado, unidade_tempo FROM tarefas_operacao WHERE sap_relacionado = ?", (sap,))
        tasks = cursor.fetchall()
        for t_code, t_desc, t_time, t_unit in tasks:
            if t_code in labor_map:
                labor_map[t_code]["total_time"] += t_time * qty
            else:
                labor_map[t_code] = {
                    "codigo_tarefa": t_code,
                    "descricao": t_desc,
                    "unidade_tempo": t_unit,
                    "total_time": t_time * qty
                }

if __name__ == "__main__":
    engine = BOMConsolidationEngine()
    if not sys.stdin.isatty():
        try:
            raw_input = sys.stdin.read()
            if raw_input:
                data = json.loads(raw_input)
                results = engine.consolidate_project(data)
                print(json.dumps(results, indent=4, ensure_ascii=False))
                sys.exit(0)
        except Exception as e:
            print(json.dumps({"error": str(e)}))
            sys.exit(1)
