import pandas as pd
path = r'c:\myworld\cqt_light\PLANILHA CUSTO MODULAR\CM AÉREO BLINDAGEM 24.01.25 CONSTRUÇÃO E NORMALIZAÇÃO -INDICA.xlsm'
xl = pd.ExcelFile(path)
df = xl.parse('Modular Blindagem', header=None, nrows=50)

# Find coordinates of "SAP" or "DESCRIÇÃO"
for r_idx, row in df.iterrows():
    for c_idx, val in enumerate(row):
        s_val = str(val).upper()
        if 'SAP' in s_val or 'DESCRIÇÃO' in s_val or 'MATERIAL' in s_val:
            print(f"Found '{s_val}' at Row {r_idx}, Col {c_idx}")
            
# Print first 10 rows
for i in range(10):
    print(f"Row {i}: {df.iloc[i].to_list()}")
