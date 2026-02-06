import json
import os

def verify_coverage():
    templates_path = r'c:\myworld\cqt_light\data\standards\structure_templates.json'
    catalog_path = r'c:\myworld\cqt_light\data\catalog\material_catalog.json'
    
    with open(templates_path, 'r', encoding='utf-8') as f:
        templates = json.load(f)
        
    with open(catalog_path, 'r', encoding='utf-8') as f:
        catalog = json.load(f)
        
    required_saps = set()
    for t_key, t_val in templates.items():
        for mat in t_val.get('materials', []):
            if isinstance(mat, dict):
                required_saps.add(str(mat.get('sap')).strip())
                
    total_required = len(required_saps)
    found_count = 0
    missing_items = []
    
    for sap in required_saps:
        if sap in catalog:
            item = catalog[sap]
            price = item.get('price', 0)
            if price > 0:
                found_count += 1
            else:
                missing_items.append(f"{sap} (Price 0.0)")
        else:
            missing_items.append(f"{sap} (Not in Catalog)")
            
    coverage = (found_count / total_required) * 100 if total_required > 0 else 0
    
    print(f"Total Unique SAPs Required by Templates: {total_required}")
    print(f"SAPs Found with Valid Price: {found_count}")
    print(f"Coverage: {coverage:.2f}%")
    
    print("\n--- Top 20 Missing/Zero-Price Items ---")
    for m in missing_items[:20]:
        print(m)
        
    # Heuristic for "Common Items"
    common_terms = ['CABO', 'POSTE', 'CRUZETA', 'ISOLADOR']
    print("\n--- Check for Common Items in Missing List ---")
    common_missing = [m for m in missing_items if any(term in str(templates).upper() for term in common_terms)] # This is a weak check, better to look up desc in template if possible
    
    # Better common check: find description in template for missing SAP
    print("\n--- Missing Common Items (with descriptions from Templates) ---")
    count_common = 0
    for m in missing_items:
        sap_code = m.split(' ')[0]
        # Find description
        desc = "Unknown"
        for t in templates.values():
            for mat in t.get('materials', []):
                if str(mat.get('sap')).strip() == sap_code:
                    desc = mat.get('description', 'Unknown')
                    break
            if desc != "Unknown": break
            
        if any(term in desc.upper() for term in common_terms):
            print(f"{m} - {desc}")
            count_common += 1
            if count_common > 10:
                print("... and more")
                break

if __name__ == "__main__":
    verify_coverage()
