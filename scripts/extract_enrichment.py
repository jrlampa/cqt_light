import pandas as pd
import json
import os
import glob
import math

def extract_enrichment():
    folder = r'c:\myworld\cqt_light\PLANILHA CUSTO MODULAR'
    output_path = r'c:\myworld\cqt_light\data\catalog\material_catalog.json'
    
    # Load existing catalog
    if os.path.exists(output_path):
        with open(output_path, 'r', encoding='utf-8') as f:
            catalog = json.load(f)
    else:
        catalog = {}
        
    files = glob.glob(os.path.join(folder, '*.xlsm'))
    
    total_updates = 0
    
    for input_path in files:
        print(f"\nProcessing {os.path.basename(input_path)}...")
        try:
            xl = pd.ExcelFile(input_path)
        except Exception as e:
            print(f"Skipping file due to load error: {e}")
            continue
            
        for sheet in xl.sheet_names:
            try:
                # Special handling for MM60 sheet (or similar structure)
                # MM60 usually has a header row at index 0
                if 'MM60' in sheet.upper():
                    df = xl.parse(sheet, header=0) # Use header
                    # Find columns by name if possible
                    cols = [str(c).strip() for c in df.columns]
                    
                    sap_idx = -1
                    desc_idx = -1
                    price_idx = -1
                    
                    # Map columns
                    for i, c in enumerate(cols):
                        if 'Material' in c: sap_idx = i
                        if 'Texto breve material' in c: desc_idx = i
                        if 'Preço' in c and 'anterior' not in c: price_idx = i # Get "Preço", avoid "Preço anterior"
                    
                    # Fallback to fixed indices if names not found (based on analysis)
                    if sap_idx == -1: sap_idx = 0
                    if desc_idx == -1: desc_idx = 3
                    if price_idx == -1: price_idx = 13
                    
                    print(f"  Mapping MM60: SAP={sap_idx}, Desc={desc_idx}, Price={price_idx}")

                    updates_in_sheet = 0
                    for index, row in df.iterrows():
                        try:
                            # SAP
                            c0 = str(row.iloc[sap_idx]).strip()
                            if c0.endswith('.0'): c0 = c0[:-2]
                            if not c0.isdigit() or len(c0) < 5: continue
                            
                            sap = c0
                            
                            # Desc
                            desc = str(row.iloc[desc_idx]).strip()
                            if desc.lower() == 'nan': continue
                            
                            # Price
                            price = 0.0
                            try:
                                p_raw = str(row.iloc[price_idx]).replace(',', '.')
                                val = float(p_raw)
                                if not math.isnan(val) and not math.isinf(val): price = val
                            except: pass
                            
                            # Update Catalog
                            if sap not in catalog:
                                catalog[sap] = {"sap": sap, "description": desc, "price": price, "unit": "UN", "source": "MM60"}
                                updates_in_sheet += 1
                            else:
                                if price > 0: 
                                    catalog[sap]['price'] = price
                                    catalog[sap]['source'] = "MM60" # Mark source as high confidence
                                updates_in_sheet += 1
                        except: continue

                    if updates_in_sheet > 0:
                        print(f"  Extracted {updates_in_sheet} items from '{sheet}' (MM60 Mode)")
                        total_updates += updates_in_sheet
                    continue # Skip to next sheet logic

                # Generic Fallback (Data Sniffing) for other sheets
                df = xl.parse(sheet, header=None)
                
                updates_in_sheet = 0
                
                # Iterate all rows
                for index, row in df.iterrows():
                    # Check pattern: Col 0 is SAP (int), Col 3 is Desc (str), Col 4/5 is Price
                    try:
                        c0 = str(row.iloc[0]).strip()
                        c3_raw = row.iloc[3]
                        c3 = str(c3_raw).strip()
                        
                        # Handle float SAP representation (e.g., 329171.0)
                        if c0.endswith('.0'): 
                            c0 = c0[:-2]
                        
                        if c0.isdigit() and len(c0) >= 5 and len(str(c3)) > 5 and 'SAP' not in c0:
                            sap = c0
                            desc = c3
                            
                            # Try Price in Col 5 then 4
                            price = 0.0
                            try:
                                p5 = str(row.iloc[5]).replace(',', '.')
                                val = float(p5)
                                if not math.isnan(val) and not math.isinf(val): price = val
                            except: pass
                            
                            if price == 0.0:
                                try:
                                    p4 = str(row.iloc[4]).replace(',', '.')
                                    val = float(p4)
                                    if not math.isnan(val) and not math.isinf(val): price = val
                                except: pass
                                
                            # Update
                            # Only update if description is not "nan"
                            if desc.lower() == 'nan': continue

                            if sap not in catalog:
                                catalog[sap] = {"sap": sap, "description": desc, "price": price, "unit": "UN", "source": "Enrichment"}
                                updates_in_sheet += 1
                            else:
                                if price > 0: catalog[sap]['price'] = price
                                catalog[sap]['source'] = "Enrichment"
                                updates_in_sheet += 1
                    except: continue
                    
                if updates_in_sheet > 0:
                    print(f"  Extracted {updates_in_sheet} items from '{sheet}'")
                    total_updates += updates_in_sheet
                    
            except Exception as e:
                # print(f"  Error parsing sheet {sheet}: {e}")
                pass

    print(f"\nTotal updates across all files: {total_updates}")
    
    # Save
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(catalog, f, indent=4, ensure_ascii=False)
    print("Catalog saved.")

if __name__ == "__main__":
    extract_enrichment()
