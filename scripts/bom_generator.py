import json
import os
import sys

# Gerador de BOM (Bill of Materials) - CQT LIGHT
# Flattern de estruturas em materiais SAP individuais.

def load_json(path):
    if not os.path.exists(path):
        return {}
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

class BOMGenerator:
    def __init__(self):
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.kits_path = os.path.join(base_dir, 'data/kits/kits.json')
        self.custom_kits_path = os.path.join(base_dir, 'data/kits/custom_kits.json')
        
        self.kits_db = load_json(self.kits_path)
        self.custom_kits_db = load_json(self.custom_kits_path)

    def get_kit_materials(self, kit_code):
        """Retorna a lista de materiais de um kit (Standard ou Custom)."""
        # Priorizar Custom Kits
        if isinstance(self.custom_kits_db, list):
            match = next((k for k in self.custom_kits_db if k.get("id") == kit_code or k.get("nome") == kit_code), None)
            if match and "materiais" in match:
                return match["materiais"]
        
        # Fallback para Standard Kits (kits.json)
        kit = self.kits_db.get(kit_code)
        if kit and "materials" in kit:
            return kit["materials"]
        return []

    def generate_bom(self, project_data):
        """Consolida todos os materiais do projeto."""
        bom = {} # Key: SAP, Value: {desc, qty, unit}
        
        # 1. Processar Estruturas/Kits
        # Note: Frontend might send "estruturas" or "structures"
        estruturas = project_data.get("estruturas", project_data.get("structures", []))
        for est in estruturas:
            kit_code = est.get("codigo", est.get("codigoKit"))
            qty_est = est.get("quantidade", 1)
            
            materials = self.get_kit_materials(kit_code)
            for mat in materials:
                sap = str(mat.get("sap", ""))
                if not sap: continue
                
                desc = mat.get("description", mat.get("descricao", ""))
                unit = mat.get("unit", mat.get("unidade", "UN"))
                # kits.json uses 'qty', custom_kits might use 'quantidade'
                qty_mat = (mat.get("qty") or mat.get("quantidade") or 0) * qty_est
                
                if sap in bom:
                    bom[sap]["quantidade"] += qty_mat
                else:
                    bom[sap] = {
                        "sap": sap,
                        "descricao": desc,
                        "unidade": unit,
                        "quantidade": qty_mat
                    }

        # 2. Processar Materiais Avulsos
        avulsos = project_data.get("materiaisAvulsos", project_data.get("looseMaterials", []))
        for mat in avulsos:
            sap = str(mat.get("sap", ""))
            if sap:
                qty = mat.get("quantidade", mat.get("qty", 0))
                if sap in bom:
                    bom[sap]["quantidade"] += qty
                else:
                    bom[sap] = {
                        "sap": sap,
                        "descricao": mat.get("descricao", mat.get("description", "")),
                        "unidade": mat.get("unidade", mat.get("unit", "UN")),
                        "quantidade": qty
                    }

        return list(bom.values())

if __name__ == "__main__":
    generator = BOMGenerator()
    
    if not sys.stdin.isatty():
        try:
            input_data = sys.stdin.read()
            if input_data:
                project_json = json.loads(input_data)
                report = generator.generate_bom(project_json)
                print(json.dumps(report, indent=4, ensure_ascii=False))
                sys.exit(0)
        except Exception as e:
            print(json.dumps([{"error": str(e)}]))
            sys.exit(1)

    # Test
    print("Run script with project JSON via STDIN.")
