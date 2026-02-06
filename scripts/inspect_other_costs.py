import pandas as pd
import os
import glob
import json

def inspect_others():
    folder = r'c:\myworld\cqt_light\PLANILHA CUSTO MODULAR'
    catalog_path = r'c:\myworld\cqt_light\data\catalog\material_catalog.json'
    
    # Load existing valid SAPs
    existing_saps = set()
    if os.path.exists(catalog_path):
        with open(catalog_path, 'r', encoding='utf-8') as f:
            cat = json.load(f)
            existing_saps = set(cat.keys())
            
    print(f"Current catalog has {len(existing_saps)} items.")
    
    files = glob.glob(os.path.join(folder, '*.xlsm'))
    
    for path in files:
        if 'BLINDAGEM' in os.path.basename(path).upper():
            continue # Skip the one we already processed
            
        print(f"\nScanning {os.path.basename(path)}...")
        try:
            xl = pd.ExcelFile(path)
            # Find candidate sheets
            for sheet in xl.sheet_names:
                if 'MODULAR' in sheet.upper() and 'SAP' in sheet.upper():
                    print(f"  Found candidate sheet: {sheet}")
                    # Try to parse properties
                    # Assuming similar structure (Header around row 4/5)
                    # We'll just dump a few rows to check
                    df = xl.parse(sheet, header=4)
                    
                    # Columns usually: Desc, SAP, Price
                    # Let's try to grab SAPs from col 1
                    try:
                        possible_saps = df.iloc[:, 1].astype(str)
                        # Filter for purely numeric SAPs (approx check)
                        valid_saps = [s.strip().replace('.0', '') for s in possible_saps if s.strip().replace('.0', '').isdigit() and len(s) > 5]
                        
                        unique_new = set(valid_saps) - existing_saps
                        print(f"    Found {len(valid_saps)} valid-looking SAPs.")
                        print(f"    New potential SAPs: {len(unique_new)}")
                        if len(unique_new) > 0:
                            print(f"    Example new SAPs: {list(unique_new)[:5]}")
                    except Exception as e:
                        print(f"    Error parsing columns: {e}")
                        
        except Exception as e:
            print(f"Error reading file: {e}")

if __name__ == "__main__":
    inspect_others()
