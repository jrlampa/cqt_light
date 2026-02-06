import pandas as pd
import json

path = r'c:\myworld\cqt_light\data\raw\CADASTRO DE KITS E MATERIAIS.xlsm'
df = pd.read_excel(path, sheet_name='KITS_ATUALIZADO', engine='openpyxl')
print(df.head(10).to_string())
print("\nColumns:", df.columns.tolist())
