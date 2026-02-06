import openpyxl

file_path = r'C:\myworld\utils\PLANILHA_DESTRAVADA.xlsm'

def extract_internal_formulas(path, row_idx=15):
    wb = openpyxl.load_workbook(path, data_only=False)
    ws = wb['QDT Dutra 2.3 Lado Esquerdo']
    
    # BI=61, BB=54
    targets = {
        "BI (internal)": 61,
        "BB (internal)": 54
    }
    
    print(f"--- Internal Formulas Row {row_idx} ---")
    for name, col in targets.items():
        cell = ws.cell(row=row_idx, column=col)
        print(f"{name} ({cell.coordinate}): {cell.value}")

if __name__ == "__main__":
    extract_internal_formulas(file_path, 15)
