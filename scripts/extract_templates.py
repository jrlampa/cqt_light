import pandas as pd
import json
import os
import argparse
from pathlib import Path
import logging

def extract_templates(
    input_path: str,
    output_path: str,
    sheet_name: str = 'KITS_MATERIAIS',
    kit_col: str = 'KIT',
    desc_col: str = 'DESCRIÇÃO',
    sap_col: str = 'MAT. SAP',
    qty_col: str = 'QTD',
    mat_desc_col: str = None,
    unit_col: str = None
):
    """
    Extracts kit/template data from an Excel sheet and outputs as JSON.
    Args:
        input_path: Path to the Excel file.
        output_path: Path to save the JSON output.
        sheet_name: Name of the sheet to parse.
        kit_col: Column name for kit ID.
        desc_col: Column name for kit description.
        sap_col: Column name for SAP/material code.
        qty_col: Column name for quantity (optional).
        mat_desc_col: Column name for material description (optional).
        unit_col: Column name for unit (optional).
    """
    logging.info(f"Reading {input_path} [{sheet_name}] ...")
    try:
        df = pd.read_excel(input_path, sheet_name=sheet_name, engine='openpyxl')
    except Exception as e:
        logging.error(f"Failed to read Excel file: {e}")
        return
    templates = {}
    current_kit = None
    for idx, row in df.iterrows():
        try:
            kit_id = str(row.get(kit_col, '')).strip()
            kit_desc = str(row.get(desc_col, '')).strip()
            sap = str(row.get(sap_col, '')).strip()
            qty = row.get(qty_col, 1.0)
            mat_desc = str(row.get(mat_desc_col, '')).strip() if mat_desc_col else ''
            unit = str(row.get(unit_col, '')).strip() if unit_col else ''
            if kit_id and kit_id.lower() != 'nan':
                current_kit = kit_id
                if current_kit not in templates:
                    templates[current_kit] = {
                        "name": kit_desc,
                        "materials": []
                    }
            if sap and sap.lower() != 'nan' and current_kit:
                material = {"sap": sap}
                if mat_desc_col:
                    material["description"] = mat_desc
                if unit_col:
                    material["unit"] = unit
                material["qty"] = float(qty) if pd.notna(qty) else 1.0
                templates[current_kit]["materials"].append(material)
        except Exception as row_e:
            logging.error(f"Error processing row {idx}: {row_e}")
            continue
    try:
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(templates, f, indent=4, ensure_ascii=False)
        logging.info(f"Extracted {len(templates)} kits/templates to {output_path}")
    except Exception as write_e:
        logging.error(f"Failed to write output JSON: {write_e}")

def main():
    parser = argparse.ArgumentParser(description="Extract kits/templates from Excel to JSON.")
    parser.add_argument('--input', required=True, help='Input Excel file path')
    parser.add_argument('--output', required=True, help='Output JSON file path')
    parser.add_argument('--sheet', default='KITS_MATERIAIS', help='Sheet name')
    parser.add_argument('--kit_col', default='KIT', help='Kit ID column')
    parser.add_argument('--desc_col', default='DESCRIÇÃO', help='Kit description column')
    parser.add_argument('--sap_col', default='MAT. SAP', help='SAP/material code column')
    parser.add_argument('--qty_col', default='QTD', help='Quantity column')
    parser.add_argument('--mat_desc_col', default=None, help='Material description column')
    parser.add_argument('--unit_col', default=None, help='Unit column')
    args = parser.parse_args()
    logging.basicConfig(level=logging.INFO)
    extract_templates(
        input_path=args.input,
        output_path=args.output,
        sheet_name=args.sheet,
        kit_col=args.kit_col,
        desc_col=args.desc_col,
        sap_col=args.sap_col,
        qty_col=args.qty_col,
        mat_desc_col=args.mat_desc_col,
        unit_col=args.unit_col
    )

if __name__ == "__main__":
    main()
