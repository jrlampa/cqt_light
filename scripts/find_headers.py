import pandas as pd

file_path = r'C:\myworld\utils\PLANILHA_DESTRAVADA.xlsm'

def find_headers(path):
    # Read first 15 rows to find the headers as they are usually spread out
    df = pd.read_excel(path, sheet_name='QDT Dutra 2.3 Lado Esquerdo', engine='openpyxl', nrows=15)
    
    for i, row in df.iterrows():
        for col_idx, val in enumerate(row):
            if pd.notna(val) and ('kVA' in str(val) or 'm' in str(val) or 'K' in str(val) or 'Queda' in str(val)):
                print(f"Row {i}, Col {col_idx}: {val}")

if __name__ == "__main__":
    find_headers(file_path)
