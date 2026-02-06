import pandas as pd
import json
import os

def extract_material_catalog():
    path = r'c:\myworld\cqt_light\data\raw\CADASTRO DE KITS E MATERIAIS.xlsm'
    output_path = r'c:\myworld\cqt_light\data\catalog\material_catalog.json'
    
    if not os.path.exists(path):
        print("Excel file not found.")
        return

    print("Reading KITS_ATUALIZADO...")
    df = pd.read_excel(path, sheet_name='KITS_ATUALIZADO', engine='openpyxl')
    
    # RedStand is SAP, TxtBrv.L is description
    # Most SAP codes are numeric strings or combinations
    catalog = {}
    
    for _, row in df.iterrows():
        sap = str(row['RedStand']).strip()
        desc = str(row['TxtBrv.L']).strip()
        
        if sap and sap != 'nan' and desc and desc != 'nan':
            catalog[sap] = {
                "sap": sap,
                "description": desc,
                "unit": "UN",  # Defaulting unit for now
                "price": 0.0    # Prices not clearly found, setting 0.0
            }
    
    # Save to catalog
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(catalog, f, indent=4, ensure_ascii=False)
    
    print(f"Extracted {len(catalog)} materials to {output_path}")

if __name__ == "__main__":
    extract_material_catalog()
