import pandas as pd
import json

file_path = r'C:\myworld\utils\PLANILHA_DESTRAVADA.xlsm'

def final_sweep(path):
    all_technical = {
        "cables": [],
        "transformers": [],
        "standard_values": {}
    }

    xl = pd.ExcelFile(path, engine='openpyxl')
    
    # Check 'Coeficiente Unitário' again for full cable list
    print("Reading Coeficiente Unitário...")
    df_coef = pd.read_excel(path, sheet_name='Coeficiente Unitário', engine='openpyxl')
    all_technical["coef_unitario_full"] = df_coef.dropna(how='all').to_dict(orient='records')

    # Check 'Tabela' again for the R and X values
    print("Reading Tabela...")
    df_tabela = pd.read_excel(path, sheet_name='Tabela', engine='openpyxl')
    all_technical["tabela_sheet_full"] = df_tabela.dropna(how='all').head(50).to_dict(orient='records')

    # Check for Transformers (searching for ratings)
    print("Searching for Transformer ratings...")
    for sheet in xl.sheet_names:
        df = pd.read_excel(path, sheet_name=sheet, engine='openpyxl')
        for col in df.columns:
            # Look for common kVA ratings in any column accurately
            try:
                unique_vals = df[col].unique()
                ratings = [30, 45, 75, 112.5, 150, 300, 500]
                found_ratings = [v for v in unique_vals if v in ratings]
                if found_ratings:
                    print(f"Found potential ratings {found_ratings} in sheet '{sheet}', column '{col}'")
                    # Store a sample of this area
                    all_technical[f"potential_trafos_{sheet}"] = df[[col]].join(df.iloc[:, max(0, df.columns.get_loc(col)-2):min(len(df.columns), df.columns.get_loc(col)+5)]).head(20).to_dict(orient='records')
            except:
                continue

    def default_handler(obj):
        if isinstance(obj, (pd.Timestamp, datetime.datetime)):
            return obj.isoformat()
        return str(obj)

    import datetime
    with open('final_technical_discovery.json', 'w', encoding='utf-8') as f:
        json.dump(all_technical, f, indent=4, ensure_ascii=False, default=default_handler)
    
    print("Final sweep saved to final_technical_discovery.json")

if __name__ == "__main__":
    final_sweep(file_path)
