import pypdf
import os
import re

def extract_standards():
    base_dir = r'c:\myworld\cqt_light\Padrões'
    
    files_to_scan = []
    
    # Dynamic search to avoid encoding issues
    for root, dirs, files in os.walk(base_dir):
        for f in files:
            f_upper = f.upper()
            path = os.path.join(root, f)
            
            # Match strict requirements
            if "COMPACTA" in f_upper and "REVISÃO 3" in f_upper and f.endswith(".pdf"):
                files_to_scan.append(path)
            elif "CONVENCIONAL" in f_upper and "2016" in f_upper and f.endswith(".pdf"):
                 files_to_scan.append(path)
            elif "ESTRUTURAS E EQUIPAMENTOS" in f_upper and f.endswith(".pdf"):
                 files_to_scan.append(path)

    print(f"Found {len(files_to_scan)} files to scan.")
    
    keywords = ['VÃO', 'TRAÇÃO', 'POTÊNCIA', 'AFASTAMENTO', 'CARGA', 'TENSÃO', 'CABO']
    
    for full_path in files_to_scan:
        print(f"\n--- Scanning {os.path.basename(full_path)} ---")
        
        # if not os.path.exists(full_path): ... (Redundant now since we found it)
            
        try:
            reader = pypdf.PdfReader(full_path)
            text_content = ""
            for i, page in enumerate(reader.pages):
                try:
                    text = page.extract_text()
                    if text:
                        text_content += text + "\n"
                except Exception as page_e:
                    print(f"  Error on page {i}: {page_e}")
            
            print(f"Extracted {len(text_content)} characters.")
            if len(text_content) < 100:
                print("  WARNING: Low text content. Might be scanned image.")
            else:
                print("--- Snippet ---")
                print(text_content[:200])
                print("--- End Snippet ---")
            
            # Simple keyword search with context
            lines = text_content.split('\n')
            for i, line in enumerate(lines):
                upper_line = line.upper()
                for key in keywords:
                    if key in upper_line:
                        # Print context (prev line + current + next)
                        context = line.strip()
                        if i > 0: context = lines[i-1].strip() + " | " + context
                        if i < len(lines)-1: context = context + " | " + lines[i+1].strip()
                        
                        # Filter out noise (too short or just the keyword)
                        if len(context) > 20: 
                             print(f"  [KEYWORD {key}]: {context}")
            
            # Specific logic extraction attempts using Regex
            
            # Max Span (Vão Máximo)
            # Pattern: "Vão" ... number ... "m"
            spans = re.findall(r'VÃO.*?(\d{2,3}).*?m', text_content, re.IGNORECASE)
            if spans:
                print(f"  Potential Max Spans found: {spans[:5]}...")
                
            # Transformer kVA
            kvas = re.findall(r'(\d{2,3})[ ]?kVA', text_content, re.IGNORECASE)
            if kvas:
                unique_kvas = sorted(list(set(kvas)), key=lambda x: int(x))
                print(f"  Transformer ratings found: {unique_kvas}")
                
            # Voltage
            voltages = re.findall(r'(\d{2})[.,]?(\d{1})?[ ]?kV', text_content, re.IGNORECASE)
            if voltages:
                print(f"  Voltages found: {voltages[:5]}...")

        except Exception as e:
            print(f"Error reading PDF: {e}")

if __name__ == "__main__":
    extract_standards()
