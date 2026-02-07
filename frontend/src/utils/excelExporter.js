import * as XLSX from 'xlsx';

/**
 * Creates a professional Excel workbook with multiple sheets
 * @param {Array} materials - Array of material objects
 * @param {Object} totals - Object with totalMaterial, totalServico, totalGeral
 * @param {Array} estruturas - Array of kit/structure objects
 * @returns {XLSX.WorkBook} Excel workbook with 3 sheets
 */
export function createProfessionalWorkbook(materials, totals, estruturas = []) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: RESUMO
  const resumoData = [
    ['ORÇAMENTO CQT LIGHT'],
    ['Data:', new Date().toLocaleDateString('pt-BR')],
    [],
    ['RESUMO FINANCEIRO'],
    ['Material:', totals.totalMaterial],
    ['Mão de Obra:', totals.totalServico],
    ['TOTAL GERAL:', totals.totalGeral],
    [],
    ['ESTATÍSTICAS'],
    [`Total de Materiais: ${materials.length}`],
    [`Total de Estruturas: ${estruturas.length}`],
  ];
  const wsResumo = XLSX.utils.aoa_to_sheet(resumoData);
  wsResumo['!cols'] = [{ wch: 25 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo');

  // Sheet 2: MATERIAIS
  const materiaisData = materials.map(mat => ({
    'SAP': mat.sap,
    'Descrição': mat.descricao,
    'Categoria': mat.categoria || 'MATERIAL',
    'Unidade': mat.unidade,
    'Quantidade': mat.quantidade,
    'Preço Unit. (R$)': Number(mat.preco_unitario).toFixed(2),
    'Subtotal (R$)': Number(mat.subtotal).toFixed(2)
  }));

  // Add totals
  materiaisData.push({});
  materiaisData.push({
    'SAP': '',
    'Descrição': 'TOTAL MATERIAL',
    'Categoria': '',
    'Unidade': '',
    'Quantidade': '',
    'Preço Unit. (R$)': '',
    'Subtotal (R$)': totals.totalMaterial.toFixed(2)
  });

  const wsMateriais = XLSX.utils.json_to_sheet(materiaisData);
  wsMateriais['!cols'] = [
    { wch: 12 }, // SAP
    { wch: 50 }, // Descrição
    { wch: 15 }, // Categoria
    { wch: 8 },  // Unidade
    { wch: 12 }, // Quantidade
    { wch: 15 }, // Preço
    { wch: 15 }  // Subtotal
  ];
  XLSX.utils.book_append_sheet(wb, wsMateriais, 'Materiais');

  // Sheet 3: ESTRUTURAS/KITS
  if (estruturas.length > 0) {
    const kitsData = estruturas.map(kit => ({
      'Código': kit.codigo_kit,
      'Descrição': kit.descricao_kit || kit.codigo_kit,
      'Quantidade': kit.quantidade || 1,
      'Preço Kit (R$)': Number(kit.preco_kit || 0).toFixed(2),
      'Subtotal (R$)': Number((kit.quantidade || 1) * (kit.preco_kit || 0)).toFixed(2)
    }));

    const wsKits = XLSX.utils.json_to_sheet(kitsData);
    wsKits['!cols'] = [
      { wch: 15 }, // Código
      { wch: 50 }, // Descrição
      { wch: 12 }, // Quantidade
      { wch: 18 }, // Preço
      { wch: 18 }  // Subtotal
    ];
    XLSX.utils.book_append_sheet(wb, wsKits, 'Estruturas');
  }

  return wb;
}

/**
 * Downloads an Excel workbook
 * @param {XLSX.WorkBook} workbook - Excel workbook
 * @param {string} filename - Filename without extension
 */
export function downloadWorkbook(workbook, filename) {
  const timestamp = new Date().toISOString().slice(0, 10);
  const fullFilename = `${filename}_${timestamp}.xlsx`;
  XLSX.writeFile(workbook, fullFilename);
}

/**
 * Exports complete budget to professional Excel
 * @param {Object} custoData - Budget data with materials, totals
 * @param {Array} estruturas - Array of structures
 * @param {string} filename - Base filename
 */
export function exportBudgetToExcel(custoData, estruturas = [], filename = 'Orcamento_CQT') {
  const wb = createProfessionalWorkbook(
    custoData.materiais || [],
    {
      totalMaterial: custoData.totalMaterial || 0,
      totalServico: custoData.totalServico || 0,
      totalGeral: custoData.totalGeral || 0
    },
    estruturas
  );
  downloadWorkbook(wb, filename);
}

// Legacy export for backwards compatibility
export function exportMaterialsToExcel(materials, totals, filename = 'configurador') {
  exportBudgetToExcel({ materiais: materials, ...totals }, [], filename);
}
