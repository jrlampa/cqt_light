import pandas as pd
import json

file_path = r'C:\myworld\utils\PLANILHA_DESTRAVADA.xlsm'

def search_trafos(path):
    print("Checking sheet: Tabela")
    try:
        df_tabela = pd.read_excel(path, sheet_name='Tabela', engine='openpyxl')
        print(df_tabela.head(20))
    except Exception as e:
        print(f"Error reading Tabela: {e}")

    print("\nChecking sheet: QDT Dutra 2.3 Lado Esquerdo for Transformer data")
    df_qdt = pd.read_excel(path, sheet_name='QDT Dutra 2.3 Lado Esquerdo', engine='openpyxl')
    
    # Search for common transformer ratings
    ratings = [30, 45, 75, 112.5, 150, 300, 500]
    for col in df_qdt.columns:
        if df_qdt[col].dtype in ['float64', 'int64']:
            found = df_qdt[df_qdt[col].isin(ratings)]
            if not found.empty:
                print(f"Potential ratings found in column {col}:")
                # Print the row and surrounding columns
                cols_to_show = list(df_qdt.columns[max(0, df_qdt.columns.get_loc(col)-2):min(len(df_qdt.columns), df_qdt.columns.get_loc(col)+5)])
                print(found[cols_to_show])

if __name__ == "__main__":
    search_trafos(file_path)
