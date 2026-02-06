import zipfile
import os
import re

arquivo_entrada = r"C:\Users\Jonatas Lampa\OneDrive - IM3 Brasil\LIGHT\LIGHT EXEMPLO CLANDESTINO\QDT  ZNA 01 PROJETADA _BASE.xlsm"
arquivo_saida = "PLANILHA_DESTRAVADA.xlsm"


def remover_protecao_excel(arquivo_entrada, arquivo_saida):
    # 1. Criar um diretório temporário para extrair os arquivos
    temp_dir = "temp_excel"
    with zipfile.ZipFile(arquivo_entrada, "r") as zip_ref:
        zip_ref.extractall(temp_dir)

    # 2. Caminho para as planilhas (worksheets)
    ws_path = os.path.join(temp_dir, "xl", "worksheets")

    # 3. Expressão regular para encontrar a tag de proteção
    # Esta tag é a que tranca as células
    protecao_re = re.compile(r"<sheetProtection.*?>")

    for filename in os.listdir(ws_path):
        if filename.endswith(".xml"):
            filepath = os.path.join(ws_path, filename)

            with open(filepath, "r", encoding="utf-8") as f:
                conteúdo = f.read()

            # Remover a tag de proteção se ela existir
            novo_conteúdo = re.sub(protecao_re, "", conteúdo)

            with open(filepath, "w", encoding="utf-8") as f:
                f.write(novo_conteúdo)

    # 4. Compactar novamente os arquivos para o formato .xlsm
    with zipfile.ZipFile(arquivo_saida, "w", zipfile.ZIP_DEFLATED) as zip_out:
        for root, dirs, files in os.walk(temp_dir):
            for file in files:
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, temp_dir)
                zip_out.write(full_path, rel_path)

    print(f"Sucesso! Arquivo salvo como: {arquivo_saida}")


if __name__ == "__main__":
    remover_protecao_excel(arquivo_entrada=arquivo_entrada, arquivo_saida=arquivo_saida)

# Uso:
# remover_protecao_excel("QDT_ZNA_01_PROJETADA_BASE.xlsm", "PLANILHA_DESTRAVADA.xlsm")
