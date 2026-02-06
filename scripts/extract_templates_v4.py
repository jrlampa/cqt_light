import pandas as pd
import json
import os

def extract_templates_v4():
    path = r'c:\myworld\cqt_light\data\raw\KIT.xlsm'
    output_path = r'c:\myworld\cqt_light\data\standards\structure_templates.json'
    
    df = pd.read_excel(path, sheet_name='KITS_MATERIAIS', engine='openpyxl')
    
    templates = {}
    current_kit = None
    
    # Column mapping based on observation:
    # KIT = index 1
    # DESCRIÇÃO = index 2
    # SAP = index 5 ('LOTE' contains the SAP codes in this sheet)
    # DESCRIÇÃO.1 = index 6 (Material description)
    # UMB = index 7 (Unit)
    
    for _, row in df.iterrows():
        # Using iloc to be safe with column names
        kit_id = str(row.iloc[1]).strip()
        kit_desc = str(row.iloc[2]).strip()
        sap = str(row.iloc[5]).strip().split('.')[0] # Remove .0 from float
        mat_desc = str(row.iloc[6]).strip()
        unit = str(row.iloc[7]).strip()
        
        if kit_id and kit_id != 'nan' and not re.match(r'^\d+$', kit_id): # Kit ID is usually Alphanumeric
            current_kit = kit_id
            if current_kit not in templates:
                templates[current_kit] = {
                    "name": kit_desc,
                    "materials": []
                }
        
        if sap and sap != 'nan' and current_kit and sap.isdigit():
            templates[current_kit]["materials"].append({
                "sap": sap,
                "description": mat_desc,
                "unit": unit,
                "qty": 1.0 # QTY not clearly separated, defaulting to 1
            })
            
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(templates, f, indent=4, ensure_ascii=False)
    
    print(f"Extracted {len(templates)} templates to {output_path}")

import re
if __name__ == "__main__":
    extract_templates_v4()
