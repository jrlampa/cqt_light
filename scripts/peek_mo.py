import json
import os

BASE_PATH = r"C:\Users\jonat\OneDrive - IM3 Brasil\utils\myworld\cqt_light"
JSON_PATH = os.path.join(BASE_PATH, "data", "raw_extraction.json")

def peek_mo():
    if not os.path.exists(JSON_PATH): return

    with open(JSON_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    for entry in data:
        for sheet_name, rows in entry['sheets'].items():
            if "CONTRATO" in sheet_name.upper():
                print(f"\nFILE: {entry['file']} | SHEET: {sheet_name}")
                # Print first 20 rows that have at least some numbers
                count = 0
                for r in rows:
                    values = [v for v in r.values() if isinstance(v, (int, float)) and v > 0]
                    if values and count < 10:
                        print(f"  Row: {r}")
                        count += 1

if __name__ == "__main__":
    peek_mo()
