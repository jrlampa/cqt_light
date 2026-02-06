import pandas as pd
import glob
import os

def inspect_item():
    folder = r'c:\myworld\cqt_light\PLANILHA CUSTO MODULAR'
    files = glob.glob(os.path.join(folder, '*.xlsm'))
    f = files[0]
    xl = pd.ExcelFile(f)
    sheet = 'MM60'
    print(f"\n--- SEARCHING {sheet} FOR 324240 ---")
    df = xl.parse(sheet, header=None)
    
    found = False
    for i, row in df.iterrows():
        row_str = [str(x).upper().strip() for x in row.tolist()]
        if '324240' in row_str:
            print(f"Row {i}: {row_str}")
            found = True
            break
            
    if not found:
        print("Item 324240 not found in MM60.")

if __name__ == "__main__":
    inspect_item()
