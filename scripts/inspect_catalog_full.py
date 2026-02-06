import pandas as pd
path = r'c:\myworld\cqt_light\data\raw\CADASTRO DE KITS E MATERIAIS.xlsm'
df = pd.read_excel(path, sheet_name='KITS_ATUALIZADO', engine='openpyxl')
print("Columns:", df.columns.tolist())
# Peek rows where we might find prices or units
print("\nSample Data (first 20 rows):")
print(df.head(20).to_string())
