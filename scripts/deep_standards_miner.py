import pypdf
import re
import json
import os
import sqlite3
from pathlib import Path

# Configurações Dinâmicas
BASE_DIR = Path(__file__).parent.parent
DB_PATH = BASE_DIR / "frontend" / "cqt_light.db"
STANDARDS_DIRS = [
    BASE_DIR / "Padrões",
    BASE_DIR / "Padrões construtivos"
]
OUTPUT_PATH = BASE_DIR / "data" / "standards" / "mining_results.json"

def get_known_saps():
    """Busca SAPs existentes no banco para cruzamento."""
    if not DB_PATH.exists():
        return set()
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT sap FROM materiais")
    saps = {row[0] for row in cursor.fetchall()}
    conn.close()
    return saps

def mine_pdfs(known_saps):
    results = []
    sap_pattern = re.compile(r'\b\d{6}\b')
    
    pdf_files = []
    for s_dir in STANDARDS_DIRS:
        if s_dir.exists():
            pdf_files.extend(list(s_dir.rglob("*.pdf")))

    print(f"Minerando {len(pdf_files)} arquivos PDF...")

    for pdf_path in pdf_files:
        try:
            print(f"Processando: {pdf_path.name}")
            reader = pypdf.PdfReader(pdf_path)
            
            for i, page in enumerate(reader.pages):
                text = page.extract_text()
                if not text: continue
                
                lines = text.split('\n')
                for line in lines:
                    matches = sap_pattern.findall(line)
                    for sap in matches:
                        is_known = sap in known_saps
                        results.append({
                            "sap": sap,
                            "is_known": is_known,
                            "context": line.strip()[:200], # Limitar contexto
                            "source": pdf_path.name,
                            "page": i + 1
                        })
        except Exception as e:
            print(f"Erro ao ler {pdf_path.name}: {e}")

    return results

def save_mining_results(results):
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    
    # Agrupar por SAP para análise de cobertura
    summary = {
        "metadata": {
            "total_matches": len(results),
            "unique_saps": len(set(r['sap'] for r in results)),
            "unknown_saps": len(set(r['sap'] for r in results if not r['is_known']))
        },
        "details": results
    }

    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(summary, f, indent=4, ensure_ascii=False)
    
    print(f"\nMineração concluída!")
    print(f"Total de SAPs únicos encontrados: {summary['metadata']['unique_saps']}")
    print(f"SAPs NÃO encontrados no banco atual: {summary['metadata']['unknown_saps']}")
    print(f"Resultados salvos em: {OUTPUT_PATH}")

if __name__ == "__main__":
    saps = get_known_saps()
    print(f"Iniciando com {len(saps)} SAPs conhecidos no banco.")
    mining_results = mine_pdfs(saps)
    save_mining_results(mining_results)
