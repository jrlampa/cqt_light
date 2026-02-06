import pypdf
import re
import json
import os

def extract_from_pdf():
    pdf_path = r'c:\myworld\cqt_light\Padrões\Padrões\Padrão RCSN\Padrão Rede RCSN - REVISÃO 04 - 2016.pdf'
    output_path = r'c:\myworld\cqt_light\data\standards\pdf_extracted.json'
    
    if not os.path.exists(pdf_path):
        print(f"File not found: {pdf_path}")
        return

    print(f"Processing {pdf_path}...")
    reader = pypdf.PdfReader(pdf_path)
    print(f"Pages: {len(reader.pages)}")
    
    extracted_items = []
    
    # Regex for SAP code (local pattern seems to be 6 digits, e.g. 309245)
    # Be careful not to match other 6 digit numbers (like dates 201604?).
    # Usually SAP codes in these docs are associated with a description.
    # We will look for lines containing a 6-digit number.
    sap_pattern = re.compile(r'\b\d{6}\b')
    
    for i, page in enumerate(reader.pages):
        text = page.extract_text()
        if not text: continue
        
        lines = text.split('\n')
        for line in lines:
            matches = sap_pattern.findall(line)
            for sap in matches:
                # Basic heuristic: if line has SAP, assume the rest is description or context
                # Clean the line
                clean_line = line.strip()
                extracted_items.append({
                    "page": i+1,
                    "sap": sap,
                    "context": clean_line
                })
                
    # Deduplicate by SAP
    unique_items = {}
    for item in extracted_items:
        if item['sap'] not in unique_items:
            unique_items[item['sap']] = item
        else:
            # Maybe append context context references?
            pass
            
    result = list(unique_items.values())
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(result, f, indent=4, ensure_ascii=False)
        
    print(f"Extracted {len(result)} potential items from PDF.")

if __name__ == "__main__":
    extract_from_pdf()
