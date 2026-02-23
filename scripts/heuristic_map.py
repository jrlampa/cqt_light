import json
import os
import difflib

BASE_PATH = r"C:\Users\jonat\OneDrive - IM3 Brasil\utils\myworld\cqt_light"
JSON_PATH = os.path.join(BASE_PATH, "data", "raw_extraction.json")

def heuristic_map():
    if not os.path.exists(JSON_PATH): return

    with open(JSON_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    # 1. Activities: Desc -> (Code, Price)
    activities = {}
    for entry in data:
        for sheet_name, rows in entry['sheets'].items():
            if "CONTRATO" in sheet_name.upper():
                for r in rows:
                    desc = str(r.get('Unnamed: 1', '')).upper().strip()
                    price = 0
                    code = None
                    for k, v in r.items():
                        if isinstance(v, (int, float)) and v > 0:
                            v_str = str(v).split('.')[0]
                            if len(v_str) == 7: code = v_str
                            else: price = v
                    if desc and price > 0:
                        activities[desc] = {"code": code, "price": price}

    # 2. Kits: ID -> Desc
    kits = {}
    for entry in data:
        for sheet_name, rows in entry['sheets'].items():
            if "KITS_MATERIAIS" in sheet_name.upper():
                for r in rows:
                    kit_id = str(r.get('KIT', '')).upper().strip()
                    desc = str(r.get('DESCRIÇÃO', '')).upper().strip()
                    if kit_id and desc and kit_id != 'NAN':
                        kits[kit_id] = desc

    print(f"Activities: {len(activities)}, Kits: {len(kits)}")

    def normalize(text):
        subs = {
            'RET ': 'RETIRADA ',
            'FERRAG.': 'FERRAGENS ',
            'LIN.': 'LINHA ',
            'TRIA.': 'TRIANGULAR ',
            'CONST ': 'CONSTRUCAO ',
            'INST ': 'INSTALACAO ',
            '.': ' ',
            '-': ' '
        }
        for k, v in subs.items():
            text = text.replace(k, v)
        return " ".join(text.split())

    # 3. Match
    matches = 0
    mapping = {}
    
    # Pre-normalize all
    norm_acts = {normalize(d): d for d in activities.keys()}
    act_tokens = {d: set(d.split()) for d in norm_acts.keys()}
    
    for kit_id, kit_desc in kits.items():
        norm_kit = normalize(kit_desc)
        kit_toks = set(norm_kit.split())
        
        best_act = None
        max_overlap = 0
        
        for act_norm, act_orig in norm_acts.items():
            overlap = len(kit_toks.intersection(act_tokens[act_norm]))
            if overlap > max_overlap and overlap >= 3: # Need at least 3 matching words
                max_overlap = overlap
                best_act = act_orig
        
        if best_act:
            mapping[kit_id] = activities[best_act]
            matches += 1

    print(f"Improved Heuristic Matches Found: {matches}")
    if mapping:
        k = list(mapping.keys())[0]
        print(f"Sample Match: Kit {k} ({kits[k]}) matches Activities: {mapping[k]}")

if __name__ == "__main__":
    heuristic_map()
