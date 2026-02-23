import json
import os
import re

BASE_PATH = r"C:\Users\jonat\OneDrive - IM3 Brasil\utils\myworld\cqt_light"
JSON_PATH = os.path.join(BASE_PATH, "data", "raw_extraction.json")

def find_patterns():
    if not os.path.exists(JSON_PATH): return

    with open(JSON_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    sap_pattern = re.compile(r'^\d{7,10}$')
    kit_pattern = re.compile(r'^[ESBT]-\d+$', re.I)

    for entry in data:
        print(f"\nFILE: {entry['file']}")
        for sheet_name, rows in entry['sheets'].items():
            found_sap = False
            found_kit = False
            sap_col = None
            kit_col = None
            
            for row in rows[:50]: # Scan first 50 rows
                for col, val in row.items():
                    val_str = str(val).strip()
                    if not found_sap and sap_pattern.match(val_str):
                        found_sap = True
                        sap_col = col
                    if not found_kit and kit_pattern.match(val_str):
                        found_kit = True
                        kit_col = col
                if found_sap and found_kit: break
            
            if found_sap or found_kit:
                print(f"  - {sheet_name}:")
                if found_sap: print(f"    Possible SAP Col: {sap_col}")
                if found_kit: print(f"    Possible KIT Col: {kit_col}")
                print(f"    SAMPLE ROW: {rows[0] if rows else 'N/A'}")

if __name__ == "__main__":
    find_patterns()
