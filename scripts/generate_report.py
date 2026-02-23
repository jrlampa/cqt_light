import json
import os

BASE_PATH = r"C:\Users\jonat\OneDrive - IM3 Brasil\utils\myworld\cqt_light"
JSON_PATH = os.path.join(BASE_PATH, "data", "raw_extraction.json")
REPORT_PATH = os.path.join(BASE_PATH, "data_analysis_report.txt")

def generate_report():
    if not os.path.exists(JSON_PATH): return

    with open(JSON_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    with open(REPORT_PATH, "w", encoding="utf-8") as out:
        for entry in data:
            out.write(f"\nFILE: {entry['file']}\n")
            for sheet_name, rows in entry['sheets'].items():
                if not rows:
                    out.write(f"  - {sheet_name}: EMPTY\n")
                    continue
                
                columns = set()
                for r in rows[:5]:
                    columns.update(r.keys())
                
                out.write(f"  - {sheet_name} ({len(rows)} rows):\n")
                out.write(f"    COLUMNS: {sorted(list(columns))}\n")
                
                # Check for critical keywords in columns
                keywords = ["SAP", "COD", "KIT", "PRECO", "VALOR", "MO", "LABOR", "ORCAMENTO"]
                found_keywords = [c for c in columns if any(k in str(c).upper() for k in keywords)]
                if found_keywords:
                    out.write(f"    INTERESTING COLS: {found_keywords}\n")
                
                out.write(f"    SAMPLE: {rows[0]}\n")
            out.write("-" * 40 + "\n")

    print(f"Report generated at {REPORT_PATH}")

if __name__ == "__main__":
    generate_report()
