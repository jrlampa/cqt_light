import json
import os
import sys
import logging
from typing import List, Dict, Any, Union

class BOMConsolidationEngine:
    """
    Enterprise BOM Generator for CQT LIGHT.
    Translates project structures and assemblies into a consolidated Bill of Materials (SAP).
    """

    def __init__(self):
        self.base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.kits_path = os.path.join(self.base_dir, 'data', 'kits', 'kits.json')
        self.custom_kits_path = os.path.join(self.base_dir, 'data', 'kits', 'custom_kits.json')
        
        self.standard_kits = self._load_json(self.kits_path)
        self.custom_kits = self._load_json(self.custom_kits_path)

    def _load_json(self, path: str) -> Union[Dict[str, Any], List[Any]]:
        """Safely loads project data files."""
        try:
            if not os.path.exists(path):
                return {}
            with open(path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            logging.error(f"IO Error loading {path}: {e}")
            return {}

    def _get_kit_data(self, kit_code: str) -> List[Dict[str, Any]]:
        """Retrieves material list for a given kit code, checking priority."""
        # 1. Search in Custom Kits (Assumes list format)
        if isinstance(self.custom_kits, list):
            match = next((k for k in self.custom_kits if str(k.get("id")) == str(kit_code) or k.get("nome") == str(kit_code)), None)
            if match and "materiais" in match:
                return match["materiais"]
        
        # 2. Search in Standard Kits (Assumes dict format)
        if isinstance(self.standard_kits, dict):
            kit = self.standard_kits.get(kit_code)
            if kit and "materials" in kit:
                return kit["materials"]
        
        return []

    def consolidate_bom(self, project: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Processes structures and loose materials into a flat SAP-ready list.
        Supports both camelCase (Frontend) and snake_case (Legacy/Internal) formats.
        """
        bom_map: Dict[str, Dict[str, Any]] = {}

        # Part 1: Assemblies/Structures
        assemblies = project.get("estruturas", project.get("structures", []))
        for assembly in assemblies:
            kit_code = assembly.get("codigo", assembly.get("codigoKit"))
            assembly_qty = assembly.get("quantidade", 1)
            
            materials = self._get_kit_data(kit_code)
            for mat in materials:
                sap = str(mat.get("sap", "")).strip()
                if not sap: continue
                
                # Normalize keys
                desc = mat.get("description", mat.get("descricao", "N/A"))
                unit = mat.get("unit", mat.get("unidade", "UN"))
                mat_kit_qty = mat.get("qty") or mat.get("quantidade") or 0
                
                total_mat_qty = mat_kit_qty * assembly_qty
                
                if sap in bom_map:
                    bom_map[sap]["quantidade"] += total_mat_qty
                else:
                    bom_map[sap] = {
                        "sap": sap,
                        "descricao": desc,
                        "unidade": unit,
                        "quantidade": total_mat_qty
                    }

        # Part 2: Loose Materials (Materiais Avulsos)
        loose_items = project.get("materiaisAvulsos", project.get("looseMaterials", []))
        for item in loose_items:
            sap = str(item.get("sap", "")).strip()
            if not sap: continue
            
            qty = item.get("quantidade", item.get("qty", 0))
            desc = item.get("descricao", item.get("description", "N/A"))
            unit = item.get("unidade", item.get("unit", "UN"))
            
            if sap in bom_map:
                bom_map[sap]["quantidade"] += qty
            else:
                bom_map[sap] = {
                    "sap": sap,
                    "descricao": desc,
                    "unidade": unit,
                    "quantidade": qty
                }

        return list(bom_map.values())

if __name__ == "__main__":
    engine = BOMConsolidationEngine()
    
    # Electron STDIN Bridge
    if not sys.stdin.isatty():
        try:
            raw_input = sys.stdin.read()
            if raw_input:
                data = json.loads(raw_input)
                results = engine.consolidate_bom(data)
                print(json.dumps(results, indent=4, ensure_ascii=False))
                sys.exit(0)
        except Exception as e:
            print(json.dumps([{"error": f"BOM Engine Failure: {str(e)}"}]))
            sys.exit(1)

    # CLI Manual Test Mock
    mock_input = {
        "structures": [{"codigo": "N1", "quantidade": 2}],
        "looseMaterials": [{"sap": "LS-01", "quantidade": 10, "descricao": "Loose Material Test"}]
    }
    print("\n[CQT LIGHT] Initing Enterprise BOM CLI Test...")
    print(json.dumps(engine.consolidate_bom(mock_input), indent=4, ensure_ascii=False))
