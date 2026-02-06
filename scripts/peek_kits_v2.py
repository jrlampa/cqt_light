import pandas as pd
import json

path = r'c:\myworld\cqt_light\data\raw\CADASTRO DE KITS E MATERIAIS.xlsm'
df = pd.read_excel(path, sheet_name='KITS_ATUALIZADO', engine='openpyxl')
# Output top 20 rows of first 5 columns to see structure
data = df.iloc[:20, :10]
print(data.to_string())
