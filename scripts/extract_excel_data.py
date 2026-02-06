import pandas as pd
import json
import os

file_path = r'C:\myworld\utils\PLANILHA_DESTRAVADA.xlsm'

def analyze_excel(path):
    if not os.path.exists(path):
        print(f"File not found: {path}")
        return

    print(f"Analyzing: {path}")
    
    # Load the Excel file metadata
    xl = pd.ExcelFile(path, engine='openpyxl')
    sheets = xl.sheet_names
    
    summary = {
        "file": path,
        "sheets": []
    }

    for sheet_name in sheets:
        print(f"Processing sheet: {sheet_name}")
        df = pd.read_excel(path, sheet_name=sheet_name, engine='openpyxl', nrows=10) # Read first 10 rows for analysis
        
        sheet_info = {
            "name": sheet_name,
            "columns": list(df.columns),
            "sample_data": df.head(3).to_dict(orient='records')
        }
        summary["sheets"].append(sheet_info)

    # Export summary to JSON for easy reading
    with open('excel_analysis.json', 'w', encoding='utf-8') as f:
        json.dump(summary, f, indent=4, ensure_ascii=False)
    
    print("Analysis complete. Metadata saved to excel_analysis.json")

if __name__ == "__main__":
    analyze_excel(file_path)
