import json
import os
import re

BASE_PATH = r"C:\Users\jonat\OneDrive - IM3 Brasil\utils\myworld\cqt_light"
JSON_PATH = os.path.join(BASE_PATH, "data", "raw_extraction.json")

def find_bridge():
    if not os.path.exists(JSON_PATH): return

    with open(JSON_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    sap_pattern = re.compile(r'^\d{6,7}$') # Material or Activity
    
    # Files of interest
    target_files = ["CADASTRO DE KITS", "PLAN MATERIAL", "RESUMO KITS"]

    for entry in data:
        if not any(t in entry['file'].upper() for t in target_files): continue
        
        print(f"\nSearching File: {entry['file']}")
        for sheet_name, rows in entry['sheets'].items():
            # Look for rows that have more than one digit-based code
            for r in rows:
                codes = []
                for v in r.values():
                    v_str = str(v).split('.')[0]
                    if sap_pattern.match(v_str):
                        codes.append(v_str)
                
                if len(set(codes)) > 1:
                    print(f"  Sheet: {sheet_name} | Row Bridge found: {r}")
                    break # Just find first sample per sheet

if __name__ == "__main__":
    find_bridge()
