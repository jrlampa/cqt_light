import pandas as pd
import json
import os
import math

def extract_kits():
    file_path = r'c:\myworld\cqt_light\data\raw\RESUMO KITS MAIS USADOS.xlsx'
    output_dir = r'c:\myworld\cqt_light\data\kits'
    os.makedirs(output_dir, exist_ok=True)
    
    print(f"Loading {file_path}...")
    xl = pd.ExcelFile(file_path)
    
    # 1. Extract POLES (Postes) from 'KITS RESUMO'
    # Look for rows where Col 0 starts with 'P' and Col 1 contains 'POSTE'
    print("Extracting Poles...")
    df_resumo = xl.parse('KITS RESUMO', header=None)
    poles = []
    
    for _, row in df_resumo.iterrows():
        try:
            code = str(row.iloc[0]).strip()
            desc = str(row.iloc[1]).strip()
            
            if code.upper().startswith('P') and 'POSTE' in desc.upper():
                poles.append({"id": code, "name": desc})
        except: continue
        
    poles_path = os.path.join(output_dir, 'poles.json')
    with open(poles_path, 'w', encoding='utf-8') as f:
        json.dump(poles, f, indent=4, ensure_ascii=False)
    print(f"Saved {len(poles)} poles to {poles_path}")

    # 2. Extract KITS from 'KITS_MATERIAIS'
    # Col 1: Kit ID, Col 2: Kit Desc, Col 5: Material SAP, Col 6: Mat Desc, Col 7: Qty/Unit?
    # Note: Inspection showed 
    # Row 1: ['nan', '13A', 'RET...', 'nan', 'nan', '307941', ... '1 UN'] or something?
    # Let's re-verify specific index from previous step:
    # Row 1: ['nan', '13A', 'RET...', ..., '307941', 'RESINA...', '1 UN'] ??
    # Actually header was: ['nan', 'KIT', 'DESCRIÇÃO', 'nan', 'nan', 'LOTE', 'DESCRIÇÃO', 'UMB']
    # So:
    # Col 1 (Index 1): Kit ID
    # Col 2 (Index 2): Kit Desc
    # Col 5 (Index 5): Mat SAP (LOTE seems to be SAP)
    # Col 6 (Index 6): Mat Desc
    # Col 7 (Index 7): Unit/Qty?
    
    print("Extracting Kits...")
    df_mats = xl.parse('KITS_MATERIAIS', header=None)
    kits = {}
    
    current_kit_id = None
    current_kit_desc = None
    
    for i, row in df_mats.iterrows():
        if i < 1: continue # Skip strict header if any
        
        try:
            c1 = str(row.iloc[1]).strip()
            c2 = str(row.iloc[2]).strip()
            c5 = str(row.iloc[5]).strip()
            c6 = str(row.iloc[6]).strip()
            # c7 might be unit
            
            # Identify Kit Header (new kit starts when c1 is not nan)
            if c1.lower() != 'nan' and c1 != '':
                current_kit_id = c1
                current_kit_desc = c2
                if current_kit_id not in kits:
                    kits[current_kit_id] = {
                        "name": current_kit_desc,
                        "materials": []
                    }
            
            # Add Material to current kit
            if current_kit_id and c5.lower() != 'nan' and c5 != '':
                # Clean SAP (remove .0)
                sap = c5.replace('.0', '')
                desc = c6
                if desc.lower() == 'nan': desc = "Sem descrição"
                
                # Assume Qty 1 for now as it's not explicit, OR check if same material appears multiple times?
                # Usually in BOMs if listed once it's 1.
                kits[current_kit_id]['materials'].append({
                    "sap": sap,
                    "description": desc,
                    "qty": 1.0 
                })
                
        except Exception as e:
            # print(f"Error row {i}: {e}")
            pass
            
    kits_path = os.path.join(output_dir, 'kits.json')
    with open(kits_path, 'w', encoding='utf-8') as f:
        json.dump(kits, f, indent=4, ensure_ascii=False)
    print(f"Saved {len(kits)} kits to {kits_path}")

if __name__ == '__main__':
    extract_kits()
