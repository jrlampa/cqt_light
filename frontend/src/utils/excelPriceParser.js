import * as XLSX from 'xlsx';

/**
 * Parse Excel file and extract price data from modular cost format
 * @param {File} file - Excel file (.xlsx, .xlsm)
 * @returns {Promise<Object>} - {success: [...], ambiguous: [...]}
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

        // Helper: Pega contexto (4 linhas acima/abaixo)
        const getContext = (lineIndex) => {
          const start = Math.max(0, lineIndex - 4);
          const end = Math.min(jsonData.length - 1, lineIndex + 4);
          return jsonData.slice(start, end + 1).map((row, idx) => ({
            lineNum: start + idx + 1,
            content: row.filter(cell => cell && cell !== '').join(' | ')
          }));
        };

        // Parse linha por linha
        const precos = [];
        const ambiguous = [];
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
              let sapFoundAtLine = null;

              while (lookAhead <= 5 && (i + lookAhead) < jsonData.length) {
                const nextRow = jsonData[i + lookAhead];

                // Procura na coluna B (índice 1)
                const colB = nextRow?.[1];
                if (colB) {
                  sapCode = extractSAP(colB);
                  if (sapCode) {
                    sapFoundAtLine = i + lookAhead;
                    console.log(`✅ [Linha ${i + 1}] Preço: R$ ${precoNum.toFixed(2)} → SAP: ${sapCode} (encontrado na linha ${sapFoundAtLine + 1})`);
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
                // AMBÍGUO: Preço sem SAP
                console.warn(`⚠️ [Linha ${i + 1}] Preço R$ ${precoNum.toFixed(2)} encontrado, mas SAP não detectado`);
                ambiguous.push({
                  type: 'price_without_sap',
                  lineNum: i + 1,
                  price: precoNum,
                  sap: null,
                  context: getContext(i)
                });
              }
            }
          }

          i++;
        }

        const result = {
          success: precos,
          ambiguous: ambiguous,
          totalSuccess: precos.length,
          totalAmbiguous: ambiguous.length
        };

        console.log(`✅ Importação automática: ${precos.length} preços | ⚠️ Casos ambíguos: ${ambiguous.length}`);
        resolve(result);
      } catch (error) {
        console.error('❌ Erro no parser:', error);
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsArrayBuffer(file);
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
