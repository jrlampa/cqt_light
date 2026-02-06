import pandas as pd
import json
import os

def extract_material_catalog():
    path = r'c:\myworld\cqt_light\data\raw\CADASTRO DE KITS E MATERIAIS.xlsm'
    output_path = r'c:\myworld\cqt_light\data\catalog\material_catalog.json'
    
    xl = pd.ExcelFile(path)
    df = xl.parse('KITS_ATUALIZADO')
    
    # Let's find index of columns by position as names have trailing spaces
    # Col 0: RedStand, Col 1: TxtBrv.L
    catalog = {}
    
    for _, row in df.iterrows():
        sap = str(row.iloc[0]).strip()
        desc = str(row.iloc[1]).strip()
        
        if sap and sap != 'nan' and desc and desc != 'nan':
            catalog[sap] = {
                "sap": sap,
                "description": desc,
                "unit": "UN",
                "price": 0.0
            }
    
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(catalog, f, indent=4, ensure_ascii=False)
    
    print(f"Extracted {len(catalog)} materials to {output_path}")

if __name__ == "__main__":
    extract_material_catalog()
