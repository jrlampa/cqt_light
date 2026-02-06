import json
import os

def init_organized_db():
    base_dir = 'data'
    standards_dir = os.path.join(base_dir, 'standards')
    catalog_dir = os.path.join(base_dir, 'catalog')
    rules_dir = os.path.join(base_dir, 'rules')

    for d in [standards_dir, catalog_dir, rules_dir]:
        if not os.path.exists(d):
            os.makedirs(d)

    # 1. Templates (PDFs de Padrão)
    templates = {
        "N1": {
            "name": "N1 - Passagem",
            "materials": [
                {"sap": "335125", "desc": "CONECTOR TERMINAL", "qty": 3},
                {"sap": "123001", "desc": "POSTE CONCRETO 11/300", "qty": 1}
            ]
        },
        "M1": {
            "name": "M1 - Meio de Vão",
            "materials": [
                {"sap": "335125", "desc": "CONECTOR TERMINAL", "qty": 1}
            ]
        }
    }
    with open(os.path.join(standards_dir, 'structure_templates.json'), 'w', encoding='utf-8') as f:
        json.dump(templates, f, indent=4, ensure_ascii=False)

    # 2. Preços/Códigos (Planilhas CM)
    catalog = {
        "335125": {"desc": "CONECTOR TERMINAL", "unit": "UN", "price": 15.50},
        "123001": {"desc": "POSTE CONCRETO 11/300", "unit": "UN", "price": 1200.00}
    }
    with open(os.path.join(catalog_dir, 'material_catalog.json'), 'w', encoding='utf-8') as f:
        json.dump(catalog, f, indent=4, ensure_ascii=False)

    # 3. Lógica de Cálculo (Roteiro)
    logic = {
        "safety_factors": {
            "traction_limit": 0.8,
            "min_clearance": 5.5
        },
        "calculation_rules": "Summation of kVA followed by diversity factor application."
    }
    with open(os.path.join(rules_dir, 'calculation_logic.json'), 'w', encoding='utf-8') as f:
        json.dump(logic, f, indent=4, ensure_ascii=False)

    print("Organized DB structure initialized.")

if __name__ == "__main__":
    init_organized_db()
