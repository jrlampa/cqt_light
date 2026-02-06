import pandas as pd
import glob
import os

def inspect_header_rows():
    file_path = r'c:\myworld\cqt_light\data\raw\RESUMO KITS MAIS USADOS.xlsx'
    
    try:
        xl = pd.ExcelFile(file_path)
        print(f"Sheets: {xl.sheet_names}")
        
        sheet = 'KITS RESUMO' 
        print(f"\n--- MATCH SHEET: {sheet} ---")
        df = xl.parse(sheet, nrows=50, header=None)
        for i, row in df.iterrows():
            clean_row = [str(x).strip() for x in row.tolist()]
            print(f"Row {i}: {clean_row}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    inspect_header_rows()
