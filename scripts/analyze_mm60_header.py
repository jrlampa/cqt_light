import pandas as pd
import glob
import os

def analyze():
    folder = r'c:\myworld\cqt_light\PLANILHA CUSTO MODULAR'
    files = glob.glob(os.path.join(folder, '*.xlsm'))
    f = files[0]
    xl = pd.ExcelFile(f)
    sheet = 'MM60'
    
    with open('mm60_analysis.txt', 'w', encoding='utf-8') as out:
        out.write(f"Analyzing {sheet} in {os.path.basename(f)}\n")
        
        try:
            df = xl.parse(sheet, nrows=20, header=None)
            
            # Print first row (Header?)
            header = [str(x).strip() for x in df.iloc[0].tolist()]
            out.write(f"Row 0 (Header?): {header}\n")
            
            # Find BRL column in first few data rows
            brl_col = -1
            for i, row in df.iterrows():
                row_list = [str(x).strip() for x in row.tolist()]
                out.write(f"Row {i}: {row_list}\n")
                
                if 'BRL' in row_list:
                    brl_col = row_list.index('BRL')
                    out.write(f"  -> Found BRL at Column {brl_col}\n")
                    
        except Exception as e:
            out.write(f"Error: {e}\n")

if __name__ == "__main__":
    analyze()
