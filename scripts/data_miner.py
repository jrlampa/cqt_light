import pandas as pd
import os
import json
import glob

# Paths
BASE_PATH = r"C:\Users\jonat\OneDrive - IM3 Brasil\utils\myworld\cqt_light"
FILES = [
    os.path.join(BASE_PATH, "CADASTRO DE KITS E MATERIAIS - PROJETOS DE CLANDESTINOS E DE BLINDAGEM.xlsm"),
    os.path.join(BASE_PATH, "PLAN MATERIAL LIGHT 2019.xls"),
    os.path.join(BASE_PATH, "RESUMO KITS MAIS USADOS.xlsx")
]
CM_FOLDER = os.path.join(BASE_PATH, "PLANILHA CUSTO MODULAR")

def sanitize_col(col):
    if not isinstance(col, str): return str(col)
    return col.strip().upper()

def extract_from_file(file_path):
    print(f"Processing: {os.path.basename(file_path)}")
    ext = os.path.splitext(file_path)[1].lower()
    
    results = {
        "file": os.path.basename(file_path),
        "sheets": {}
    }
    
    try:
        if ext == ".xls":
            # xls doesn't support engine='openpyxl'
            xl = pd.ExcelFile(file_path, engine='xlrd')
        else:
            xl = pd.ExcelFile(file_path, engine='openpyxl')
            
        for sheet_name in xl.sheet_names:
            df = xl.parse(sheet_name)
            if df.empty: continue
            
            # Convert to list of dicts for deep mining
            data_sample = df.to_dict(orient='records')
            results["sheets"][sheet_name] = data_sample
            
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        
    return results

def main():
    all_data = []
    
    # Process main files
    for f in FILES:
        if os.path.exists(f):
            all_data.append(extract_from_file(f))
            
    # Process CM folder
    cm_files = glob.glob(os.path.join(CM_FOLDER, "*.xlsm"))
    for f in cm_files:
        all_data.append(extract_from_file(f))
        
    # Save raw extraction for analysis
    output_path = os.path.join(BASE_PATH, "data", "raw_extraction.json")
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(all_data, f, ensure_ascii=False, indent=2, default=str)
        
    print(f"Deep Mining complete. Data saved to {output_path}")

if __name__ == "__main__":
    main()
