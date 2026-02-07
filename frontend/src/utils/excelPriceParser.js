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

        // Procurar aba "Custo Materiais" ou similar
        let sheetName = workbook.SheetNames.find(
          name => {
            const lower = name.toLowerCase();
            return (lower.includes('custo') && lower.includes('materiais')) ||
              lower.includes('preço') ||
              lower.includes('preco') ||
              lower === 'materiais';
          }
        );

        // Se não encontrar, usar primeira aba
        if (!sheetName) {
          console.warn('Aba "Custo Materiais" não encontrada, usando primeira aba:', workbook.SheetNames[0]);
          sheetName = workbook.SheetNames[0];
        }

        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

        if (jsonData.length < 2) {
          reject(new Error('Planilha vazia ou sem dados'));
          return;
        }

        // Detectar colunas SAP e Preço com múltiplos padrões
        const headerRow = jsonData[0] || [];

        // Padrões para SAP
        const sapPatterns = ['sap', 'código', 'codigo', 'cod', 'material', 'item'];
        const sapColIndex = headerRow.findIndex(h => {
          if (!h) return false;
          const str = h.toString().toLowerCase();
          return sapPatterns.some(pattern => str.includes(pattern));
        });

        // Padrões para Preço
        const precoPatterns = ['preço', 'preco', 'valor', 'custo', 'unitário', 'unitario', 'price'];
        const precoColIndex = headerRow.findIndex(h => {
          if (!h) return false;
          const str = h.toString().toLowerCase();
          return precoPatterns.some(pattern => str.includes(pattern));
        });

        if (sapColIndex === -1 || precoColIndex === -1) {
          // Criar mensagem de erro detalhada
          const availableColumns = headerRow
            .map((h, i) => h ? `${i}: "${h}"` : null)
            .filter(Boolean)
            .join(', ');

          reject(new Error(
            `Colunas não encontradas no cabeçalho.\n\n` +
            `Procurando:\n` +
            `- SAP: ${sapPatterns.join(', ')}\n` +
            `- Preço: ${precoPatterns.join(', ')}\n\n` +
            `Colunas disponíveis: ${availableColumns || 'nenhuma'}\n\n` +
            `Certifique-se que a primeira linha contém os nomes das colunas.`
          ));
          return;
        }

        console.log(`✅ Colunas detectadas: SAP="${headerRow[sapColIndex]}" (índice ${sapColIndex}), Preço="${headerRow[precoColIndex]}" (índice ${precoColIndex})`);

        // Parse rows
        const precos = [];
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          const sap = row[sapColIndex];
          const preco = row[precoColIndex];

          // Skip empty rows
          if (!sap || sap === '') continue;

          if (preco !== undefined && preco !== null && preco !== '') {
            let precoNum = typeof preco === 'number' ? preco : parseFloat(preco.toString().replace(',', '.'));

            if (!isNaN(precoNum)) {
              precos.push({
                sap: sap.toString().trim(),
                preco_unitario: precoNum
              });
            }
          }
        }

        if (precos.length === 0) {
          reject(new Error('Nenhum preço válido encontrado na planilha'));
          return;
        }

        console.log(`✅ Parsed ${precos.length} preços`);
        resolve(precos);
      } catch (error) {
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
