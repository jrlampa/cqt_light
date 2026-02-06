import pandas as pd
path = r'c:\myworld\cqt_light\data\raw\CADASTRO DE KITS E MATERIAIS.xlsm'
df = pd.read_excel(path, sheet_name='KITS', engine='openpyxl')
# Search for N1, M2 etc in any column
for col in df.columns:
    matches = df[df[col].astype(str).str.contains('N1|M1|N2|M2|N3|M3', na=False, case=True)]
    if not matches.empty:
        print(f"--- Matches in column {col} ---")
        print(matches.head(10).to_string())
