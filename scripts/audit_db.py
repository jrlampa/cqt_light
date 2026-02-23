import json
import os

BASE_PATH = r"C:\Users\jonat\OneDrive - IM3 Brasil\utils\myworld\cqt_light"
DB_PATH = os.path.join(BASE_PATH, "data", "unified_database.json")
REPORT_PATH = os.path.join(BASE_PATH, "data", "database_audit_report.json")

def audit():
    if not os.path.exists(DB_PATH):
        print("Database not found.")
        return

    with open(DB_PATH, "r", encoding="utf-8") as f:
        db = json.load(f)

    materials = db.get("materials", {})
    kits = db.get("kits", {})

    stats = {
        "materials": {
            "total": len(materials),
            "missing_price": 0,
            "missing_desc": 0,
            "no_mo": 0
        },
        "kits": {
            "total": len(kits),
            "missing_desc": 0,
            "missing_items": 0,
            "no_mo": 0
        }
    }

    gaps = {
        "materials_no_price": [],
        "kits_no_mo": []
    }

    for sap, mat in materials.items():
        if mat.get("price", 0) <= 0:
            stats["materials"]["missing_price"] += 1
            gaps["materials_no_price"].append({"sap": sap, "desc": mat.get("description")})
        if not mat.get("description"):
            stats["materials"]["missing_desc"] += 1
        if mat.get("mo", 0) <= 0:
            stats["materials"]["no_mo"] += 1

    for kit_id, kit in kits.items():
        if not kit.get("description"):
            stats["kits"]["missing_desc"] += 1
        if not kit.get("items"):
            stats["kits"]["missing_items"] += 1
        if kit.get("mo") is None:
            stats["kits"]["no_mo"] += 1
            gaps["kits_no_mo"].append({"kit_id": kit_id, "desc": kit.get("description")})

    report = {
        "summary": stats,
        "gaps": gaps
    }

    with open(REPORT_PATH, "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)

    print(f"Audit Complete.")
    print(f"Materials: {stats['materials']['total']} total, {stats['materials']['missing_price']} missing price, {stats['materials']['no_mo']} no MO.")
    print(f"Kits: {stats['kits']['total']} total, {stats['kits']['no_mo']} no MO.")
    print(f"Detailed report saved to {REPORT_PATH}")

if __name__ == "__main__":
    audit()
