import pandas as pd
import json

file_path = r'C:\myworld\utils\PLANILHA_DESTRAVADA.xlsm'

def extract_tech_details(path):
    results = {}

    # 1. Extract Cables from 'Coeficiente Unitário'
    print("Extracting Cable data...")
    df_coef = pd.read_excel(path, sheet_name='Coeficiente Unitário', engine='openpyxl')
    # Finding the 'Cabos' table. Let's look for the header row.
    # From sample: Unnamed: 1 = "Cabos", Unnamed: 2 = "R", Unnamed: 3 = "X"
    cables_df = df_coef.dropna(subset=['Unnamed: 1', 'Unnamed: 2', 'Unnamed: 3'])
    results['cables'] = cables_df.rename(columns={
        'Unnamed: 1': 'Cabo',
        'Unnamed: 2': 'R',
        'Unnamed: 3': 'X',
        'Unnamed: 4': 'Coef_Queda'
    })[['Cabo', 'R', 'X', 'Coef_Queda']].to_dict(orient='records')

    # 2. Extract Transformers from 'QDT Dutra 2.3 Lado Esquerdo'
    # Transformers often appear in dropdowns or lists. 
    # Let's try to find potential transformer ratings.
    print("Extracting Transformer data...")
    df_qdt = pd.read_excel(path, sheet_name='QDT Dutra 2.3 Lado Esquerdo', engine='openpyxl')
    
    # Try to find 'Potência' and 'Impedância' columns
    # We saw these in the metadata around line 926.
    # Let's search for values like 30, 45, 75, 112.5
    potential_trafos = []
    for col in df_qdt.columns:
        if df_qdt[col].dtype in ['float64', 'int64']:
            matches = df_qdt[df_qdt[col].isin([30, 45, 75, 112.5, 150, 300, 500])]
            if not matches.empty:
                # If we find a column with power ratings, let's see adjacent columns for impedance
                # This is a bit heuristic, but let's see.
                pass

    # Actually, let's just dump the 'Coeficiente Unitário' first as it's the most reliable source for impedance.
    # Saving results
    with open('technical_data.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=4, ensure_ascii=False)
    
    print("Technical data saved to technical_data.json")

if __name__ == "__main__":
    extract_tech_details(file_path)
