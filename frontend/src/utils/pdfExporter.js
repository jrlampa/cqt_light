import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Gera relatório PDF completo do orçamento/BOM de engenharia.
 * @param {Object} params
 * @param {Array}  params.materiais      - Lista de materiais com sap, descricao, quantidade, subtotal
 * @param {Object} params.custoData      - { totalMaterial, totalServico, totalGeral }
 * @param {Array}  params.estruturas     - Kits/estruturas selecionados
 * @param {Object} params.condutorMT     - Condutor MT ativo
 * @param {Object} params.condutorBT     - Condutor BT ativo
 * @param {Object} params.empresa        - Empresa ativa (pode ser null)
 */
export function gerarRelatorioPDF({
  materiais = [],
  custoData = {},
  estruturas = [],
  condutorMT = null,
  condutorBT = null,
  empresa = null,
}) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const now = new Date().toLocaleString('pt-BR');

  // ── Cabeçalho ───────────────────────────────────────────────────────────────
  doc.setFillColor(37, 99, 235); // blue-600
  doc.rect(0, 0, pageW, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('CQT Light — Relatório de Orçamento', 14, 11);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Emitido em: ${now}`, 14, 18);
  if (empresa?.nome) doc.text(`Empresa: ${empresa.nome}`, 14, 23);
  doc.text('Zenith Engineering Intelligence | v3.0', pageW - 14, 18, { align: 'right' });

  // ── Seção 1: Dados Gerais ────────────────────────────────────────────────────
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Dados Gerais do Projeto', 14, 36);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  const dadosGerais = [
    ['Estruturas / Kits', `${estruturas.length} unidade(s)`],
    ['Total de Itens de Material', `${materiais.length}`],
    ['Condutor MT Ativo', condutorMT?.descricao || condutorMT?.codigo || '—'],
    ['Condutor BT Ativo', condutorBT?.descricao || condutorBT?.codigo || '—'],
  ];

  autoTable(doc, {
    startY: 40,
    head: [['Campo', 'Valor']],
    body: dadosGerais,
    theme: 'grid',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [30, 64, 175], textColor: 255, fontStyle: 'bold' },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 70 } },
    margin: { left: 14, right: 14 },
  });

  // ── Seção 2: Resumo Financeiro ───────────────────────────────────────────────
  const y2 = doc.lastAutoTable.finalY + 8;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('2. Resumo Financeiro', 14, y2);

  const fmtBRL = (v) =>
    Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const resumo = [
    ['Material', fmtBRL(custoData.totalMaterial)],
    ['Mão de Obra / Serviços', fmtBRL(custoData.totalServico)],
    ['TOTAL GERAL', fmtBRL(custoData.totalGeral)],
  ];

  autoTable(doc, {
    startY: y2 + 4,
    head: [['Categoria', 'Valor (R$)']],
    body: resumo,
    theme: 'grid',
    styles: { fontSize: 10 },
    headStyles: { fillColor: [5, 150, 105], textColor: 255, fontStyle: 'bold' },
    bodyStyles: { halign: 'right' },
    columnStyles: {
      0: { halign: 'left', fontStyle: 'bold' },
      1: { halign: 'right' },
    },
    didParseCell(data) {
      if (data.row.index === 2) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [209, 250, 229];
      }
    },
    margin: { left: 14, right: 14 },
  });

  // ── Seção 3: Lista de Materiais (BOM) ────────────────────────────────────────
  const y3 = doc.lastAutoTable.finalY + 8;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('3. Lista de Materiais (BOM)', 14, y3);

  const bomRows = materiais.map((m) => [
    m.sap || '—',
    m.descricao || '—',
    m.categoria || 'MATERIAL',
    m.unidade || 'UN',
    String(m.quantidade ?? 0),
    fmtBRL(m.preco_unitario),
    fmtBRL(m.subtotal),
  ]);

  autoTable(doc, {
    startY: y3 + 4,
    head: [['SAP', 'Descrição', 'Categoria', 'UN', 'Qtd', 'Unit. (R$)', 'Subtotal (R$)']],
    body: bomRows,
    theme: 'striped',
    styles: { fontSize: 7.5, cellPadding: 1.5 },
    headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold', fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 65 },
      2: { cellWidth: 24 },
      3: { cellWidth: 10, halign: 'center' },
      4: { cellWidth: 12, halign: 'right' },
      5: { cellWidth: 24, halign: 'right' },
      6: { cellWidth: 24, halign: 'right' },
    },
    margin: { left: 14, right: 14 },
  });

  // ── Rodapé ───────────────────────────────────────────────────────────────────
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text(
      `Gerado automaticamente pelo CQT Light — Zenith Project Assistant | Página ${i} de ${pageCount}`,
      pageW / 2,
      doc.internal.pageSize.getHeight() - 6,
      { align: 'center' }
    );
  }

  // Baixar
  doc.save(`orcamento_cqt_${Date.now()}.pdf`);
}
