import pandas as pd
import sqlite3

# Configurações
ARQUIVO_EXCEL = "PLANILHA_DESTRAVADA.xlsm"
NOME_BANCO = "database_completo.db"
NOME_ABA = "PP e CE"


def processar_pp_ce():
    print(f"--- Iniciando extração da aba: {NOME_ABA} ---")
    conn = sqlite3.connect(NOME_BANCO)

    try:
        # Lê a aba inteira sem cabeçalho para varrer os blocos
        df_raw = pd.read_excel(ARQUIVO_EXCEL, sheet_name=NOME_ABA, header=None)
        lista_dados = []

        # Varre as colunas de 5 em 5 (estrutura detectada na análise)
        for i in range(0, df_raw.shape[1], 5):
            # Recorta o bloco atual
            bloco = df_raw.iloc[:, i : i + 5].copy()

            # Verifica se o bloco é válido (tem título na linha 1)
            if pd.isna(bloco.iloc[1, 0]):
                continue

            # Extrai o número do Programa Prioritário (PP) do título na linha 0
            titulo_bruto = str(df_raw.iloc[0, i])
            # Ex: "Programa Prioritário (PP): 01" -> pega só o "01"
            num_pp = (
                titulo_bruto.split(":")[-1].strip()
                if ":" in titulo_bruto
                else titulo_bruto
            )

            # Define os nomes das colunas e limpa os dados
            bloco.columns = [
                "Motivo",
                "Tensao",
                "Sistema",
                "Custo_Estrategico",
                "Descricao",
            ]
            # Pega dados da linha 2 em diante e remove vazios na coluna chave
            dados_limpos = bloco.iloc[2:].dropna(subset=["Descricao"]).copy()

            # Adiciona a coluna identificadora
            dados_limpos["Programa_PP"] = num_pp

            lista_dados.append(dados_limpos)

        # Junta tudo e salva
        if lista_dados:
            df_final = pd.concat(lista_dados, ignore_index=True)
            df_final.to_sql("ref_codigos_obra", conn, if_exists="replace", index=False)
            print(
                f"Sucesso! {len(df_final)} códigos salvos na tabela 'ref_codigos_obra'."
            )
        else:
            print("Aviso: Nenhum dado encontrado.")

    except Exception as e:
        print(f"Erro ao processar {NOME_ABA}: {e}")
    finally:
        conn.close()


if __name__ == "__main__":
    processar_pp_ce()
