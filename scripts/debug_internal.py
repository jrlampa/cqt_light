import openpyxl

file_path = r'C:\myworld\utils\PLANILHA_DESTRAVADA.xlsm'

def debug_internal_vars(path, row_idx=15):
    wb = openpyxl.load_workbook(path, data_only=True)
    ws = wb['QDT Dutra 2.3 Lado Esquerdo']
    
    # Check BI15 and BB15
    # BI = 61, BB = 54
    # Wait, in openpyxl alphabet: BI is 61? Let's check: B=2, I=9 -> 2*26+9 = 61. A is 1.
    # BB: 2*26+2 = 54.
    targets = {
        "BI (internal)": 61,
        "BB (internal)": 54,
        "AY (Rca)": 51,
        "BD (XL)": 56
    }
    
    print(f"--- Internal Variables Row {row_idx} ---")
    for name, col in targets.items():
        val = ws.cell(row=row_idx, column=col).value
        print(f"{name} (Col {col}): {val}")

if __name__ == "__main__":
    debug_internal_vars(file_path, 15)
