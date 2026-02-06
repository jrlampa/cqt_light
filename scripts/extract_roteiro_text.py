import zipfile
import xml.etree.ElementTree as ET
import os

def extract_text_from_docx(docx_path):
    if not os.path.exists(docx_path):
        print(f"File not found: {docx_path}")
        return ""
    
    try:
        # docx is a zip file
        with zipfile.ZipFile(docx_path, 'r') as zip_ref:
            # Main content is in word/document.xml
            with zip_ref.open('word/document.xml') as f:
                xml_content = f.read()
        
        # Parse XML
        root = ET.fromstring(xml_content)
        # Namespace for word processingML
        ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
        
        # Find all text elements
        text_elements = root.findall('.//w:t', ns)
        return ' '.join([t.text for t in text_elements if t.text])
    
    except Exception as e:
        print(f"Error extracting text: {e}")
        return ""

if __name__ == "__main__":
    path = r'C:\myworld\cqt_light\MINUTA - ROTEIRO PARA ELABORAÇÃO DE PROJETOS DE RDA EM ÁREAS URBANAS.docx'
    text = extract_text_from_docx(path)
    # Save full text to file
    with open('roteiro_full_text.txt', 'w', encoding='utf-8') as f:
        f.write(text)
    print("Full text saved to roteiro_full_text.txt")
