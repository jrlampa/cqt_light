import openpyxl

file_path = r'C:\myworld\utils\PLANILHA_DESTRAVADA.xlsm'

def debug_bi_parts(path, row_idx=15):
    wb = openpyxl.load_workbook(path, data_only=True)
    ws = wb['QDT Dutra 2.3 Lado Esquerdo']
    
    # AT=46, AW=49, BX=76, BE=57
    targets = {
        "AT (R20)": 46,
        "AW (Alpha)": 49,
        "BX (Temp)": 76,
        "BE (Factor?)": 57
    }
    
    print(f"--- BI15 Components Row {row_idx} ---")
    for name, col in targets.items():
        val = ws.cell(row=row_idx, column=col).value
        print(f"{name} (Col {col}): {val}")

if __name__ == "__main__":
    debug_bi_parts(file_path, 15)
