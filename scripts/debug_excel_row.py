import pandas as pd
import openpyxl

file_path = r'C:\myworld\utils\PLANILHA_DESTRAVADA.xlsm'

def debug_row(path, row_idx=15):
    wb = openpyxl.load_workbook(path, data_only=True)
    ws = wb['QDT Dutra 2.3 Lado Esquerdo']
    
    # Let's read precisely the columns from the formula: BW15, BJ15, AR15, BZ15, H15
    # BW=75, BJ=62, AR=44, BZ=78, H=8
    targets = {
        "H (Phase)": 8,
        "AR (Length)": 44,
        "BJ (K)": 62,
        "BW (P/kVA)": 75,
        "BZ (Delta V)": 78
    }
    
    print(f"--- Debugging Row {row_idx} ---")
    for name, col in targets.items():
        val = ws.cell(row=row_idx, column=col).value
        print(f"{name} (Col {col}): {val}")

if __name__ == "__main__":
    debug_row(file_path, 15)
