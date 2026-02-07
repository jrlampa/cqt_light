import * as XLSX from 'xlsx';

/**
 * Parse Excel file and extract price data from "Custo Materiais" sheet
 * @param {File} file - Excel file (.xlsx, .xlsm)
 * @returns {Promise<Array>} - Array of {sap, preco_unitario}
 */
export async function parseExcelPrecos(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        // Procurar aba relevante ou usar primeira
        let sheetName = workbook.SheetNames.find(
          name => {
            const lower = name.toLowerCase();
            return (lower.includes('custo') && lower.includes('materiais')) ||
              lower.includes('preço') ||
              lower.includes('preco') ||
              lower === 'materiais';
          }
        );

        if (!sheetName) {
          console.warn('Aba "Custo Materiais" não encontrada, usando primeira aba:', workbook.SheetNames[0]);
          sheetName = workbook.SheetNames[0];
        }

        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '', blankrows: true });

        if (jsonData.length < 2) {
          reject(new Error('Planilha vazia ou sem dados'));
          return;
        }

        console.log(`📊 Processando planilha "${sheetName}" com ${jsonData.length} linhas`);

        // Helper: Extrai SAP entre parênteses
        const extractSAP = (text) => {
          if (!text) return null;
          const match = text.toString().match(/\((\d+)\)/);
          return match ? match[1] : null;
        };

        // Helper: Verifica se linha é subheader (ignora)
        const isSubHeader = (row) => {
          if (!row || row.length === 0) return false;
          const firstCell = row[0]?.toString().toLowerCase() || '';
          return firstCell.includes('custo') ||
            firstCell.includes('equipamento') ||
            firstCell.includes('estrutura') ||
            firstCell.includes('modulares');
        };

        // Parse linha por linha
        const precos = [];
        let i = 0;

        while (i < jsonData.length) {
          const row = jsonData[i];

          // Skip subheaders e linhas vazias iniciais
          if (isSubHeader(row) || !row || row.every(cell => !cell || cell === '')) {
            i++;
            continue;
          }

          // Coluna C (índice 2) = Preço
          const precoRaw = row[2];

          if (precoRaw !== undefined && precoRaw !== null && precoRaw !== '') {
            const precoNum = typeof precoRaw === 'number'
              ? precoRaw
              : parseFloat(precoRaw.toString().replace(',', '.'));

            if (!isNaN(precoNum) && precoNum > 0) {
              // Encontrou preço! Agora procura SAP nas próximas linhas
              let sapCode = null;
              let lookAhead = 1;

              while (lookAhead <= 5 && (i + lookAhead) < jsonData.length) {
                const nextRow = jsonData[i + lookAhead];

                // Procura na coluna B (índice 1)
                const colB = nextRow?.[1];
                if (colB) {
                  sapCode = extractSAP(colB);
                  if (sapCode) {
                    console.log(`✅ [Linha ${i + 1}] Preço: R$ ${precoNum.toFixed(2)} → SAP: ${sapCode} (encontrado na linha ${i + lookAhead + 1})`);
                    break;
                  }
                }

                lookAhead++;
              }

              if (sapCode) {
                precos.push({
                  sap: sapCode,
                  preco_unitario: precoNum
                });
              } else {
                console.warn(`⚠️ [Linha ${i + 1}] Preço R$ ${precoNum.toFixed(2)} encontrado, mas SAP não detectado nas próximas 5 linhas`);
              }
            }
          }

          i++;
        }

        if (precos.length === 0) {
          reject(new Error(
            'Nenhum preço válido encontrado.\n\n' +
            'Este parser procura:\n' +
            '- Preços na coluna C\n' +
            '- Códigos SAP no formato "TEXTO (NUMERO)" na coluna B das linhas seguintes\n\n' +
            'Verifique se seu arquivo segue esse padrão.'
          ));
          return;
        }

        console.log(`✅ Importação concluída: ${precos.length} preços extraídos`);
        resolve(precos);
      } catch (error) {
        console.error('❌ Erro no parser:', error);
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
  });
}

/**
 * Validate and preview import data
 * @param {Array} precos - Array of {sap, preco_unitario}
 * @param {Array} existingSaps - Array of existing SAP codes in DB
 * @returns {Object} - {totalLinhas, novos, atualizacoes, preview}
 */
export function validateImportPreview(precos, existingSaps = []) {
  const sapSet = new Set(existingSaps);

  let novos = 0;
  let atualizacoes = 0;

  precos.forEach(item => {
    if (sapSet.has(item.sap)) {
      atualizacoes++;
    } else {
      novos++;
    }
  });

  return {
    totalLinhas: precos.length,
    novos,
    atualizacoes,
    preview: precos.slice(0, 5) // First 5 for preview
  };
}
