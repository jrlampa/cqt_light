import pandas as pd
import os

def inspect_costs():
    path = r'c:\myworld\cqt_light\PLANILHA CUSTO MODULAR\CM AÉREO BLINDAGEM 24.01.25 CONSTRUÇÃO E NORMALIZAÇÃO -INDICA.xlsm'
    
    try:
        xl = pd.ExcelFile(path)
        print(f"Sheets in {os.path.basename(path)}:")
        print(f"Scanning {len(xl.sheet_names)} sheets for SAP/Material data...")
        
        target_sheet = None
        for sheet in xl.sheet_names:
            try:
                # Read header only
                df = xl.parse(sheet, nrows=5) 
                # Check for keywords in stringified values of first few rows
                combined_text = df.astype(str).to_string().upper()
                if 'SAP' in combined_text and ('DESC' in combined_text or 'MAT' in combined_text):
                    print(f"FOUND POTENTIAL CATALOG: {sheet}")
                    print(df.head())
                    target_sheet = sheet
                    break
            except Exception as e:
                pass
                
        if target_sheet:
            print(f"extracting from {target_sheet}...")
    except Exception as e:
        print(f"Error inspecting file: {e}")

if __name__ == "__main__":
    inspect_costs()
