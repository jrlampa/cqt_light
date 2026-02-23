import json
import os

BASE_PATH = r"C:\Users\jonat\OneDrive - IM3 Brasil\utils\myworld\cqt_light"
JSON_PATH = os.path.join(BASE_PATH, "data", "raw_extraction.json")

def analyze():
    if not os.path.exists(JSON_PATH):
        print("JSON not found")
        return

    with open(JSON_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    for entry in data:
        print(f"\nFILE: {entry['file']}")
        for sheet_name, rows in entry['sheets'].items():
            if not rows:
                print(f"  - {sheet_name}: EMPTY")
                continue
            
            # Get common keys across first 5 rows to ensure we catch all potential headers
            columns = set()
            for r in rows[:5]:
                columns.update(r.keys())
            
            print(f"  - {sheet_name} ({len(rows)} rows):")
            print(f"    COLUMNS: {sorted(list(columns))}")
            
            # Print a sample row to see data types/values
            if rows:
                print(f"    SAMPLE: {rows[0]}")

if __name__ == "__main__":
    analyze()
