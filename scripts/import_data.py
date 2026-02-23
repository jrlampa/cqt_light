import json
import sqlite3
import os

BASE_PATH = r"C:\Users\jonat\OneDrive - IM3 Brasil\utils\myworld\cqt_light"
DB_PATH = os.path.join(BASE_PATH, "cqt_light.db")
UNIFIED_JSON = os.path.join(BASE_PATH, "data", "unified_database.json")

def migrate():
    if not os.path.exists(UNIFIED_JSON):
        print("Unified database JSON not found.")
        return

    with open(UNIFIED_JSON, "r", encoding="utf-8") as f:
        data = json.load(f)

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        # 1. Update Materials
        print(f"Upserting {len(data['materials'])} materials...")
        material_data = [
            (sap, m['description'], m.get('unit', 'UN'), m.get('price', 0), m.get('type', ''))
            for sap, m in data['materials'].items()
        ]
        
        cursor.executemany("""
            INSERT INTO materiais (sap, descricao, unidade, preco_unitario, tipo_padronizado)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(sap) DO UPDATE SET
                descricao = excluded.descricao,
                unidade = excluded.unidade,
                preco_unitario = excluded.preco_unitario,
                tipo_padronizado = excluded.tipo_padronizado
        """, material_data)

        # 2. Update Kits
        print(f"Upserting {len(data['kits'])} kits...")
        kit_data = []
        for kid, k in data['kits'].items():
            mo_cost = k['mo']['price'] if k.get('mo') else 0
            mo_code = k['mo']['code'] if k.get('mo') else None
            kit_data.append((kid, k['description'], k.get('category', ''), k.get('observation', ''), mo_code, mo_cost))

        cursor.executemany("""
            INSERT INTO kits (codigo_kit, descricao_kit, categoria, observacao_engenharia, codigo_servico, custo_servico)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(codigo_kit) DO UPDATE SET
                descricao_kit = excluded.descricao_kit,
                categoria = excluded.categoria,
                observacao_engenharia = excluded.observacao_engenharia,
                codigo_servico = excluded.codigo_servico,
                custo_servico = excluded.custo_servico
        """, kit_data)

        # 3. Update Composition (Clearing existing for these kits it might be better, or standard upsert)
        # For simplicity and to avoid orphaned items, we'll clear composition for kits we are about to import
        all_kit_ids = list(data['kits'].keys())
        # Processing in chunks to avoid sqlite limits
        chunk_size = 500
        for i in range(0, len(all_kit_ids), chunk_size):
            chunk = all_kit_ids[i:i + chunk_size]
            placeholders = ','.join(['?'] * len(chunk))
            cursor.execute(f"DELETE FROM kit_composicao WHERE codigo_kit IN ({placeholders})", chunk)

        print("Inserting kit compositions...")
        composition_data = []
        for kid, k in data['kits'].items():
            for item in k['items']:
                composition_data.append((kid, item['sap'], 1.0)) # Default qty 1 for now if not specified

        cursor.executemany("""
            INSERT OR IGNORE INTO kit_composicao (codigo_kit, sap, quantidade)
            VALUES (?, ?, ?)
        """, composition_data)

        conn.commit()

        # 4. Update Labor Tasks (DIM_TAREFA_OPERACAO)
        print(f"Upserting {len(data['labor_tasks'])} labor tasks...")
        labor_data = [
            (t['code'], t['description'], t['time'], t['unit'], t['sap_relacionado'])
            for t in data['labor_tasks'].values()
        ]
        cursor.executemany("""
            INSERT INTO tarefas_operacao (codigo_tarefa, descricao_operacao, tempo_estimado, unidade_tempo, sap_relacionado)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(codigo_tarefa) DO UPDATE SET
                descricao_operacao = excluded.descricao_operacao,
                tempo_estimado = excluded.tempo_estimado,
                unidade_tempo = excluded.unidade_tempo,
                sap_relacionado = excluded.sap_relacionado
        """, labor_data)

        # 5. Update Contracts (FATO_OBRAS_CONTRATO)
        print(f"Upserting {len(data['contracts'])} contracts...")
        contract_data = [
            (c['number'], c['empresa'])
            for c in data['contracts'].values()
        ]
        cursor.executemany("""
            INSERT INTO obras_contrato (numero_contrato, empresa_terceira)
            VALUES (?, ?)
            ON CONFLICT(numero_contrato) DO UPDATE SET
                empresa_terceira = excluded.empresa_terceira
        """, contract_data)

        conn.commit()
        print("Migration successful.")

    except Exception as e:
        conn.rollback()
        print(f"Migration failed: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
