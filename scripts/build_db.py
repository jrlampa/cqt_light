import json
import os
import re

BASE_PATH = r"C:\Users\jonat\OneDrive - IM3 Brasil\utils\myworld\cqt_light"
RAW_JSON = os.path.join(BASE_PATH, "data", "raw_extraction.json")
FINAL_JSON = os.path.join(BASE_PATH, "data", "unified_database.json")

def clean_val(v):
    try:
        if isinstance(v, str):
            v = v.replace('R$', '').replace('.', '').replace(',', '.').strip()
        v_float = float(v)
        return 0 if v_float != v_float else v_float # handle nan
    except:
        return 0

def build():
    if not os.path.exists(RAW_JSON): return

    with open(RAW_JSON, "r", encoding="utf-8") as f:
        raw_data = json.load(f)

    materials = {} # sap -> {desc, price, mo, unit}
    kits = {} # kit_id -> {desc, items: [{sap, qty}]}
    mo_prices = {} # sap -> mo_price

    for entry in raw_data:
        file_name = entry['file']
        
        for sheet_name, rows in entry['sheets'].items():
            # 1. Extract Materials from MM60
            if "MM60" in sheet_name.upper():
                for r in rows:
                    sap = str(r.get('Material', '')).split('.')[0]
                    if not sap or len(sap) < 5 or sap == 'nan': continue
                    materials[sap] = {
                        "description": str(r.get('Texto breve material', '')),
                        "price": clean_val(r.get('        Preço', r.get('MM60', 0))),
                        "unit": str(r.get('UMB', 'UN')),
                        "type": str(r.get('Tipo de material', r.get('Setor', ''))),
                        "mo": 0,
                        "source": file_name
                    }

            # 2. Extract MO (Labor) from CONTRATO sheets
            if "CONTRATO" in sheet_name.upper():
                for r in rows:
                    desc = str(r.get('Unnamed: 1', '')).upper().strip()
                    price = 0
                    code = None
                    # Search for 7-digit code and price
                    for k, v in r.items():
                        if isinstance(v, (int, float)) and v > 0:
                            v_str = str(v).split('.')[0]
                            if len(v_str) == 7: code = v_str
                            else: price = v
                    if desc and price > 0:
                        mo_prices[desc] = {"code": code, "price": price}

    def normalize_text(text):
        subs = {
            'RET ': 'RETIRADA ', 'FERRAG.': 'FERRAGENS ', 'LIN.': 'LINHA ',
            'TRIA.': 'TRIANGULAR ', 'CONST ': 'CONSTRUCAO ', 'INST ': 'INSTALACAO ',
            '.': ' ', '-': ' '
        }
        text = str(text).upper().strip()
        for k, v in subs.items():
            text = text.replace(k, v)
        return " ".join(text.split())

    # Build Activity Map for heuristics
    activity_norm_map = {}
    for desc, data in mo_prices.items():
        norm_desc = normalize_text(desc)
        activity_norm_map[norm_desc] = data

    act_tokens = {d: set(d.split()) for d in activity_norm_map.keys()}

    # Kits processing with MO match
    for entry in raw_data:
        for sheet_name, rows in entry['sheets'].items():
            if "KITS_MATERIAIS" in sheet_name.upper() or "KITS RESUMO" in sheet_name.upper():
                for r in rows:
                    kit_id = str(r.get('KIT', '')).strip()
                    if not kit_id or kit_id == 'nan' or kit_id == 'NAN': continue
                    
                    if kit_id not in kits:
                        kit_desc = r.get('DESCRIÇÃO', r.get('DESCRIÇÃO.1', ''))
                        kits[kit_id] = {
                            "description": str(kit_desc), 
                            "category": str(r.get('CATEGORIA', '')),
                            "observation": str(r.get('OBSERVAÇÃO', '')),
                            "items": [], 
                            "mo": None
                        }
                        
                        # Heuristic match for MO
                        norm_kit = normalize_text(kit_desc)
                        kit_toks = set(norm_kit.split())
                        best_act_norm = None
                        max_overlap = 0
                        for act_norm in activity_norm_map.keys():
                            overlap = len(kit_toks.intersection(act_tokens[act_norm]))
                            if overlap > max_overlap and overlap >= 3:
                                max_overlap = overlap
                                best_act_norm = act_norm
                        
                        if best_act_norm:
                            kits[kit_id]["mo"] = activity_norm_map[best_act_norm]

                    sap = str(r.get('LOTE', '')).split('.')[0]
                    if sap and sap != 'nan':
                        desc = r.get('DESCRIÇÃO.1', '')
                        kits[kit_id]["items"].append({"sap": sap, "desc": desc})

    print(f"Stats: {len(materials)} materials, {len(kits)} kits.")
    
    # NEW: Extract Labor Tasks and Contracts (MER Hardening)
    labor_tasks = {}
    contracts = {}
    
    print("Extracting Labor Tasks and Contracts from raw data...")
    for entry in raw_data:
        fname = entry.get("file", "")
        for sname, rows in entry.get("sheets", {}).items():
            # Identify Contract sheets
            is_contract_sheet = "CONTRATO" in sname.upper() or "CUSTO MODULAR" in sname.upper()
            if is_contract_sheet:
                for r in rows:
                    # A. Contracts Metadata
                    for col, val in r.items():
                        if isinstance(val, str) and "CONTRATO" in val.upper() and "Nº" in val.upper():
                            c_id = re.search(r"Nº (\d+)", val)
                            empresa = val.split(" - ")[0] if " - " in val else val
                            if c_id:
                                contracts[c_id.group(1)] = {"number": c_id.group(1), "empresa": empresa}
                    
                    # B. Labor Tasks (DIM_TAREFA_OPERACAO)
                    # Task code is often in the first numeric-ish column
                    t_code = None
                    for k, v in r.items():
                        if isinstance(v, (int, float)) and v == v: # Check for NaN (NaN != NaN)
                            v_int = int(v)
                            if len(str(v_int)) == 7:
                                t_code = str(v_int)
                                break
                    
                    if t_code:
                        t_desc = r.get(list(r.keys())[0], "")
                        if not isinstance(t_desc, str) or t_desc.isdigit():
                            t_desc = r.get('Unnamed: 1', "")
                        
                        if t_desc:
                            sap_match = re.search(r"\(ITEM (\d+)\)", str(t_desc))
                            sap_rel = sap_match.group(1) if sap_match else None
                            labor_tasks[t_code] = {
                                "code": t_code, "description": str(t_desc),
                                "unit": str(r.get('Unnamed: 3', 'HH')),
                                "time": clean_val(r.get('Unnamed: 4', 0)),
                                "sap_relacionado": sap_rel
                            }

    # Save Unified Output
    output = {
        "materials": materials,
        "kits": kits,
        "labor_tasks": labor_tasks,
        "contracts": contracts,
        "metadata": {
            "total_materials": len(materials),
            "total_kits": len(kits),
            "total_tasks": len(labor_tasks),
            "total_contracts": len(contracts),
            "extraction_info": "Deep Data Mining Cycle 16 (MER Standard)"
        }
    }

    with open(FINAL_JSON, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"Unified database created at {FINAL_JSON}")
    print(f"Stats: {len(materials)} materials, {len(kits)} kits, {len(labor_tasks)} tasks, {len(contracts)} contracts.")

if __name__ == "__main__":
    build()
