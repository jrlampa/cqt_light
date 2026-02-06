import pandas as pd
path = r'c:\myworld\cqt_light\data\raw\CADASTRO DE KITS E MATERIAIS.xlsm'
xl = pd.ExcelFile(path)
df = xl.parse('KITS_ATUALIZADO')
# Show row 11 onwards and specifically columns around RedStand
print(df.iloc[10:30, :5].to_string())
