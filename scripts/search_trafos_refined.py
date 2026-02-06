import pandas as pd
import json

file_path = r'C:\myworld\utils\PLANILHA_DESTRAVADA.xlsm'

def search_trafos_refined(path):
    print("Checking sheet: Tabela (full scan for Transformers)")
    df_tabela = pd.read_excel(path, sheet_name='Tabela', engine='openpyxl')
    
    # Look for keywords in all cells
    keywords = ['trafo', 'transformador', 'kva', 'impedância', '%', 'potência']
    for keyword in keywords:
        mask = df_tabela.apply(lambda row: row.astype(str).str.contains(keyword, case=False).any(), axis=1)
        if mask.any():
            print(f"\nKeyword '{keyword}' found in Tabela:")
            print(df_tabela[mask].head(10))

    print("\nChecking sheet: QDT Dutra 2.3 Lado Esquerdo (full scan for Transformers)")
    df_qdt = pd.read_excel(path, sheet_name='QDT Dutra 2.3 Lado Esquerdo', engine='openpyxl')
    for keyword in keywords:
        mask = df_qdt.apply(lambda row: row.astype(str).str.contains(keyword, case=False).any(), axis=1)
        if mask.any():
            print(f"\nKeyword '{keyword}' found in QDT Dutra:")
            # Show relevant columns
            rows = df_qdt[mask]
            for idx, row in rows.iterrows():
                # Print non-NaN values in the row to find data
                print(f"Row {idx}: {row.dropna().to_dict()}")

if __name__ == "__main__":
    search_trafos_refined(file_path)
