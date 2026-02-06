import pandas as pd
import json
import os
import re

def extract_structure_templates():
    path = r'c:\myworld\cqt_light\data\raw\CADASTRO DE KITS E MATERIAIS.xlsm'
    output_path = r'c:\myworld\cqt_light\data\standards\structure_templates.json'
    
    xl = pd.ExcelFile(path)
    df = xl.parse('KITS')
    
    # KITS sheet has structures. Let's try to group them.
    # Looking for patterns like N1, M1, etc.
    templates = {}
    
    # We need to find which materials belong to which structure.
    # Often structures are headers or have a specific ID.
    # In my search earlier, I saw '13N3' in L.Tarefa.
    
    current_structure = None
    for _, row in df.iterrows():
        id_val = str(row['L.Tarefa']).strip()
        descr = str(row['Descr']).strip()
        
        # Heuristic: if id_val matches a structure pattern
        if re.match(r'^[1-3][A-Z][1-4]', id_val):
            current_structure = id_val
            if current_structure not in templates:
                templates[current_structure] = {
                    "name": descr,
                    "materials": []
                }
        elif current_structure:
            # If it's not a header, it might be a material belonging to the structure?
            # Or the sheet is just a flat list of kits.
            pass

    # Let's try another approach: 'RESUMO KITS MAIS USADOS.xlsx' might be better.
    print(f"Structure templates found in KITS: {list(templates.keys())[:10]}")

if __name__ == "__main__":
    extract_structure_templates()
