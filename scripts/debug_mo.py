import json
import os
import re

BASE_PATH = r"C:\Users\jonat\OneDrive - IM3 Brasil\utils\myworld\cqt_light"
RAW_JSON = os.path.join(BASE_PATH, "data", "raw_extraction.json")

def debug_mo():
    if not os.path.exists(RAW_JSON): return

    with open(RAW_JSON, "r", encoding="utf-8") as f:
        raw_data = json.load(f)

    materials_keys = set()
    for entry in raw_data:
        for sheet_name, rows in entry['sheets'].items():
            if "MM60" in sheet_name.upper():
                for r in rows:
                    sap = str(r.get('Material', '')).split('.')[0]
                    if sap: materials_keys.add(sap)

    print(f"Total material keys: {len(materials_keys)}")
    
    for entry in raw_data:
        for sheet_name, rows in entry['sheets'].items():
            if "CONTRATO" in sheet_name.upper():
                print(f"\nAnalyzing {entry['file']} | {sheet_name}")
                found_samples = []
                for r in rows:
                    # Look for anything that looks like a SAP (7 digits)
                    for k, v in r.items():
                        v_str = str(v).split('.')[0]
                        if re.match(r'^\d{7}$', v_str):
                            match_status = "MATCH" if v_str in materials_keys else "NO MATCH"
                            found_samples.append(f"Val: {v_str} | Key: {k} | {match_status}")
                    if len(found_samples) > 10: break
                
                for s in found_samples[:10]:
                    print(f"  {s}")

if __name__ == "__main__":
    debug_mo()
