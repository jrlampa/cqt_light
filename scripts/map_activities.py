import json
import os
import re

BASE_PATH = r"C:\Users\jonat\OneDrive - IM3 Brasil\utils\myworld\cqt_light"
JSON_PATH = os.path.join(BASE_PATH, "data", "raw_extraction.json")

def map_activities():
    if not os.path.exists(JSON_PATH): return

    with open(JSON_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    # 1. Collect all Activity Codes from Contrato Parceira sheets
    activity_to_price = {}
    for entry in data:
        for sheet_name, rows in entry['sheets'].items():
            if "CONTRATO" in sheet_name.upper():
                # We know from prev peek that usually the 1st col is Code, 4th is Price
                # But let's be safe and check for 7-digit codes
                for r in rows:
                    vals = list(r.values())
                    code = None
                    price = None
                    for v in vals:
                        v_str = str(v).split('.')[0]
                        if re.match(r'^\d{7}$', v_str):
                            code = v_str
                            break
                    
                    # Assume price is one of the float values in the row > 0
                    for v in vals:
                        if isinstance(v, (int, float)) and v > 0.1 and str(v) != code:
                            price = v # Likely the price
                            # Keep it if it's in a likely column index or just take the last one found
                    
                    if code and price:
                        activity_to_price[code] = price

    print(f"Total Activities found: {len(activity_to_price)}")

    # 2. Find where these activities relate to KITS or MATERIALS
    activity_to_kit = {}
    for entry in data:
        for sheet_name, rows in entry['sheets'].items():
            # In CADASTRO DE KITS, LOTE usually holds the Activity Code
            if "KITS_MATERIAIS" in sheet_name.upper() or "PARTE A1" in sheet_name.upper():
                for r in rows:
                    kit_id = str(r.get('KIT', r.get('Unnamed: 12', ''))).strip()
                    code = str(r.get('LOTE', r.get('Unnamed: 13', ''))).split('.')[0]
                    
                    if kit_id and code in activity_to_price:
                        activity_to_kit[kit_id] = code

    print(f"Successfully linked {len(activity_to_kit)} kits to activities.")
    
    # Sample link
    if activity_to_kit:
        sample_kit = list(activity_to_kit.keys())[0]
        sample_code = activity_to_kit[sample_kit]
        print(f"Link Sample: Kit {sample_kit} -> Activity {sample_code} ($ {activity_to_price[sample_code]})")

if __name__ == "__main__":
    map_activities()
