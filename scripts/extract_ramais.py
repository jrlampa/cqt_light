import pandas as pd
import json
import os

file_path = r'c:\myworld\cqt_light\PLANILHA_DESTRAVADA.xlsm'

def extract_ramais_data(path):
    if not os.path.exists(path):
        print(f"File not found: {path}")
        return

    print("Extracting Ramais sheet...")
    try:
        # Load the 'Ramais' sheet
        df = pd.read_excel(path, sheet_name='Ramais', engine='openpyxl', header=None)
        
        # Save the whole sheet to a JSON for inspection
        data = df.values.tolist()
        with open('data/ramais_raw.json', 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=4, ensure_ascii=False)
        print("Ramais raw data saved to data/ramais_raw.json")
        
        # Look for Demand values. Often they are in a table below the headers.
        # Let's print some rows
        for i, row in enumerate(data[:30]):
            print(f"Row {i}: {row}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    extract_ramais_data(file_path)
