import openpyxl

file_path = r'C:\myworld\utils\PLANILHA_DESTRAVADA.xlsm'

def search_specific_formulas(path):
    print(f"Loading workbook: {path}")
    wb = openpyxl.load_workbook(path, data_only=False)
    
    # We want to find where the coefficient from 'Coeficiente Unitário' is used.
    # From previous analysis, 'Coeficiente Unitário' E5 is 0.240193...
    # Let's find cells that reference this sheet or look for the P*L*K pattern.
    
    ws_qdt = wb['QDT Dutra 2.3 Lado Esquerdo']
    print("\n--- Searching formulas in QDT Dutra 2.3 Lado Esquerdo ---")
    
    target_keywords = ['Coeficiente', 'Unitário', '*', '/']
    
    # Let's look at the columns where the calculation actually happens.
    # Usually around columns 60-120 in this wide sheet.
    for row in ws_qdt.iter_rows(min_row=10, max_row=50, min_col=50, max_col=116):
        for cell in row:
            if isinstance(cell.value, str) and '=' in cell.value:
                # Look for multiplication of 3 terms: something * something * coefficient
                # Or patterns like (L * P * K)
                if '*' in cell.value and ('kVA' in cell.value or 'm' in cell.value or 'K' in cell.value):
                     print(f"Cell {cell.coordinate}: {cell.value}")
                elif any(kw in cell.value for kw in ['Unitário', 'Coef']):
                     print(f"Cell {cell.coordinate}: {cell.value}")

if __name__ == "__main__":
    search_specific_formulas(file_path)
