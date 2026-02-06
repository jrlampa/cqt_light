import pandas as pd
import os

file_path = r'c:\myworld\cqt_light\data\raw\CADASTRO DE KITS E MATERIAIS.xlsm'

def list_sheets(path):
    if not os.path.exists(path):
        print(f"File not found: {path}")
        return
    
    xl = pd.ExcelFile(path, engine='openpyxl')
    print(f"Sheets in {os.path.basename(path)}: {xl.sheet_names}")

list_sheets(file_path)
