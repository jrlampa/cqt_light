import sqlite3
import re
from pathlib import Path

# Configurações Dinâmicas
BASE_DIR = Path(__file__).parent.parent
DB_PATH = BASE_DIR / "frontend" / "cqt_light.db"

def audit_abnt():
    """
    Valida se os materiais seguem padrões ABNT/NBR:
    1. Descrição em caixa alta.
    2. Unidades padronizadas (UN, M, KG, CJ, etc.).
    3. Ausência de caracteres especiais desnecessários.
    """
    if not DB_PATH.exists():
        print(f"Erro: Banco de dados não encontrado em {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute("SELECT sap, descricao, unidade FROM materiais")
    materiais = cursor.fetchall()
    
    unidades_padrao = {'UN', 'M', 'KG', 'CJ', 'PAR', 'RL', 'PC', 'JG'}
    violacoes = []

    print(f"--- AUDITORIA ABNT/NBR (Total: {len(materiais)} itens) ---")

    for sap, desc, und in materiais:
        item_violacoes = []
        
        # 1. Validação de Caixa Alta
        if desc and desc != desc.upper():
            item_violacoes.append("Descrição deve estar em CAIXA ALTA")
            
        # 2. Validação de Unidade
        if und and und.upper() not in unidades_padrao:
            item_violacoes.append(f"Unidade '{und}' não está no padrão ABNT {unidades_padrao}")
            
        # 3. Validação de caracteres (sanitização)
        if re.search(r'[;|_]', desc):
            item_violacoes.append("Descrição contém caracteres proibidos (; | _)")

        if item_violacoes:
            violacoes.append({
                "sap": sap,
                "descricao": desc,
                "problemas": item_violacoes
            })

    if violacoes:
        print(f"\n⚠️ Encontradas {len(violacoes)} violações de padrão:")
        # Mostrar apenas top 10
        for v in list(violacoes)[:10]: 
            print(f"  - SAP {v['sap']}: {', '.join(v['problemas'])}")
        
        if len(violacoes) > 10:
            print(f"  ... e mais {len(violacoes) - 10} itens.")
    else:
        print("\n✅ Todos os materiais seguem as normas ABNT/NBR básicas.")

    conn.close()

if __name__ == "__main__":
    audit_abnt()
