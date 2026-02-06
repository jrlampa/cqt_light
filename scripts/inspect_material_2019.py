import pandas as pd
path = r'c:\myworld\cqt_light\data\raw\PLAN MATERIAL LIGHT 2019.xls'
# This is .xls, might need xlrd or just pandas
xl = pd.ExcelFile(path)
print("Sheets:", xl.sheet_names)
df = xl.parse(xl.sheet_names[0])
print("Columns:", df.columns.tolist())
print(df.head(10).to_string())
