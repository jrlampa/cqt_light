import json
import pandas as pd
import glob
import os

def debug_catalog_and_source():
    # 1. Check JSON Catalog
    json_path = r'c:\myworld\cqt_light\data\catalog\material_catalog.json'
    if os.path.exists(json_path):
        with open(json_path, 'r', encoding='utf-8') as f:
            catalog = json.load(f)
        
        sap_missing = "324240"
        sap_template = "309107"
        
        print(f"--- CATALOG CHECK ---")
        if sap_missing in catalog:
            print(f"Item {sap_missing}: {catalog[sap_missing]}")
        else:
            print(f"Item {sap_missing} NOT in catalog.")
            
        if sap_template in catalog:
            print(f"Item {sap_template}: {catalog[sap_template]}")
        else:
            print(f"Item {sap_template} NOT in catalog.")
    else:
        print("Catalog file not found.")

    # 2. Check MM60 Source for 309107
    folder = r'c:\myworld\cqt_light\PLANILHA CUSTO MODULAR'
    files = glob.glob(os.path.join(folder, '*.xlsm'))
    f = files[0]
    xl = pd.ExcelFile(f)
    sheet = 'MM60'
    print(f"\n--- SEARCHING {sheet} FOR {sap_template} ---")
    try:
        df = xl.parse(sheet, header=None)
        found = False
        for i, row in df.iterrows():
            row_str = [str(x).upper().strip() for x in row.tolist()]
            if sap_template in row_str:
                print(f"Row {i}: {row_str}")
                found = True
                break # Just find first
        if not found:
            print(f"Item {sap_template} NOT found in MM60.")
    except Exception as e:
        print(f"Error parsing MM60: {e}")

if __name__ == "__main__":
    debug_catalog_and_source()
