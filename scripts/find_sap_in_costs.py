import pandas as pd
import os
import glob

def find_sap_in_folder(folder_path, sap_code):
    files = glob.glob(os.path.join(folder_path, "*.xlsm")) + glob.glob(os.path.join(folder_path, "*.xlsx"))
    for file_path in files:
        print(f"Searching in {os.path.basename(file_path)}...")
        try:
            xl = pd.ExcelFile(file_path)
            for sheet in xl.sheet_names:
                df = pd.read_excel(xl, sheet_name=sheet)
                mask = df.apply(lambda row: row.astype(str).str.contains(str(sap_code)).any(), axis=1)
                if not df[mask].empty:
                    print(f"  FOUND IN SHEET: {sheet}")
                    print(df[mask].to_string())
        except Exception as e:
            print(f"  Error reading {file_path}: {e}")

if __name__ == "__main__":
    folder = r"c:\myworld\cqt_light\PLANILHA CUSTO MODULAR"
    find_sap_in_folder(folder, "313068")
