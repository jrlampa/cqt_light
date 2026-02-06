import pandas as pd
path = r'c:\myworld\cqt_light\data\raw\CADASTRO DE KITS E MATERIAIS.xlsm'
df = pd.read_excel(path, sheet_name='KITS', engine='openpyxl')
print(df.head(20).to_string())
