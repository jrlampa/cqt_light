import pandas as pd
path = r'c:\myworld\cqt_light\data\raw\CADASTRO DE KITS E MATERIAIS.xlsm'
xl = pd.ExcelFile(path)
df = xl.parse('CAPA 01')
print("--- CAPA 01 ---")
print(df.head(20).to_string())

df_ce = xl.parse('C.E.11')
print("\n--- C.E.11 ---")
print(df_ce.head(20).to_string())
