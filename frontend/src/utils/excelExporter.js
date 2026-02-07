import * as XLSX from 'xlsx';

/**
 * Creates an Excel workbook from materials data
 * @param {Array} materials - Array of material objects
 * @param {Object} totals - Object with totalMaterial, totalServico, totalGeral
 * @returns {XLSX.WorkBook} Excel workbook
 */
export function createMaterialsWorkbook(materials, totals) {
  // Prepare data for worksheet
  const data = materials.map(mat => ({
    'SAP': mat.sap,
    'Descrição': mat.descricao,
    'Unidade': mat.unidade,
    'Quantidade': mat.quantidade,
    'Preço Unitário (R$)': mat.preco_unitario,
    'Subtotal (R$)': mat.subtotal,
    'Categoria': mat.categoria || ''
  }));

  // Add totals at the bottom
  data.push({});
  data.push({
    'SAP': '',
    'Descrição': 'TOTAL MATERIAL',
    'Unidade': '',
    'Quantidade': '',
    'Preço Unitário (R$)': '',
    'Subtotal (R$)': totals.totalMaterial
  });
  data.push({
    'SAP': '',
    'Descrição': 'TOTAL M.O.',
    'Unidade': '',
    'Quantidade': '',
    'Preço Unitário (R$)': '',
    'Subtotal (R$)': totals.totalServico
  });
  data.push({
    'SAP': '',
    'Descrição': 'TOTAL GERAL',
    'Unidade': '',
    'Quantidade': '',
    'Preço Unitário (R$)': '',
    'Subtotal (R$)': totals.totalGeral
  });

  // Create worksheet
  const ws = XLSX.utils.json_to_sheet(data);

  // Set column widths
  ws['!cols'] = [
    { wch: 12 }, // SAP
    { wch: 50 }, // Descrição
    { wch: 8 },  // Unidade
    { wch: 12 }, // Quantidade
    { wch: 18 }, // Preço Unitário
    { wch: 18 }, // Subtotal
    { wch: 18 }  // Categoria
  ];

  // Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Materiais');

  return wb;
}

/**
 * Downloads an Excel workbook
 * @param {XLSX.WorkBook} workbook - Excel workbook
 * @param {string} filename - Filename without extension
 */
export function downloadWorkbook(workbook, filename) {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  const fullFilename = `${filename}_${timestamp}.xlsx`;
  XLSX.writeFile(workbook, fullFilename);
}

/**
 * Exports materials to Excel
 * @param {Array} materials - Array of material objects
 * @param {Object} totals - Object with totalMaterial, totalServico, totalGeral
 * @param {string} filename - Base filename (default: 'configurador')
 */
export function exportMaterialsToExcel(materials, totals, filename = 'configurador') {
  const wb = createMaterialsWorkbook(materials, totals);
  downloadWorkbook(wb, filename);
}
