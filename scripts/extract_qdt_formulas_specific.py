import openpyxl

file_path = r'C:\myworld\utils\PLANILHA_DESTRAVADA.xlsm'

def extract_qdt_formulas(path):
    wb = openpyxl.load_workbook(path, data_only=False)
    ws = wb['QDT Dutra 2.3 Lado Esquerdo']
    
    # We'll check Row 15, where data typically begins
    row_idx = 15
    # Columns to check: L (42), P (75), ΔV (78), K (57)
    # Note: openpyxl is 1-indexed, so we add 1 to the pandas/0-indexed cols.
    cols = [42, 57, 62, 69, 75, 78, 79] 
    
    print(f"--- Formulas in Row {row_idx} ---")
    for col in cols:
        cell = ws.cell(row=row_idx, column=col)
        print(f"Col {col} ({cell.coordinate}): {cell.value}")

if __name__ == "__main__":
    extract_qdt_formulas(file_path)
