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

        // Procurar aba "Custo Materiais"
        const sheetName = workbook.SheetNames.find(
          name => name.toLowerCase().includes('custo') && name.toLowerCase().includes('materiais')
        );

        if (!sheetName) {
          reject(new Error('Aba "Custo Materiais" não encontrada'));
          return;
        }

        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // Detectar colunas SAP e Preço
        const headerRow = jsonData[0] || [];
        const sapColIndex = headerRow.findIndex(h =>
          h && (h.toString().toLowerCase().includes('sap') || h.toString().toLowerCase().includes('código'))
        );
        const precoColIndex = headerRow.findIndex(h =>
          h && (h.toString().toLowerCase().includes('preço') || h.toString().toLowerCase().includes('valor'))
        );

        if (sapColIndex === -1 || precoColIndex === -1) {
          reject(new Error('Colunas SAP ou Preço não encontradas no cabeçalho'));
          return;
        }

        // Parse rows
        const precos = [];
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          const sap = row[sapColIndex];
          const preco = row[precoColIndex];

          if (sap && preco !== undefined && preco !== null && preco !== '') {
            const precoNum = typeof preco === 'number' ? preco : parseFloat(preco.toString().replace(',', '.'));

            if (!isNaN(precoNum)) {
              precos.push({
                sap: sap.toString().trim(),
                preco_unitario: precoNum
              });
            }
          }
        }

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
