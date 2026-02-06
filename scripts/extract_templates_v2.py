import pandas as pd
import json
import os

def extract_templates_refined():
    path = r'c:\myworld\cqt_light\data\raw\KIT.xlsm'
    output_path = r'c:\myworld\cqt_light\data\standards\structure_templates.json'
    
    df = pd.read_excel(path, sheet_name='KITS_MATERIAIS', engine='openpyxl')
    
    templates = {}
    # KIT column has the structure IDs like 13CE2J (?)
    # Actually, structural IDs like N1, M1 usually correspond to 'RedStand' in the other sheet.
    # In KIT.xlsm, 'KIT' column seems to be the key.
    
    current_kit = None
    for _, row in df.iterrows():
        kit_id = str(row['KIT']).strip()
        descr = str(row['DESCRIÇÃO']).strip()
        sap = str(row['MAT. SAP']).strip()
        qty = row['QTD']
        
        if kit_id and kit_id != 'nan':
            current_kit = kit_id
            if current_kit not in templates:
                templates[current_kit] = {
                    "name": descr,
                    "materials": []
                }
        
        if sap and sap != 'nan' and current_kit:
            templates[current_kit]["materials"].append({
                "sap": sap,
                "qty": float(qty) if not pd.isna(qty) else 1.0
            })
            
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(templates, f, indent=4, ensure_ascii=False)
    
    print(f"Extracted {len(templates)} kits/templates to {output_path}")

if __name__ == "__main__":
    extract_templates_refined()
