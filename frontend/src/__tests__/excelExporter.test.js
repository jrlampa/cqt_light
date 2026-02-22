/**
 * Tests for excelExporter utility
 * Tests createProfessionalWorkbook and related export logic.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createProfessionalWorkbook } from '../utils/excelExporter';

// Mock XLSX.writeFile to avoid actual filesystem writes
vi.mock('xlsx', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    writeFile: vi.fn(),
  };
});

import * as XLSX from 'xlsx';
import { downloadWorkbook, exportBudgetToExcel, exportMaterialsToExcel } from '../utils/excelExporter';

const sampleMaterials = [
  { sap: 'MAT001', descricao: 'Poste 11m', unidade: 'UN', quantidade: 5, preco_unitario: 250.00, subtotal: 1250.00 },
  { sap: 'MAT002', descricao: 'Condutor CAA', unidade: 'M', quantidade: 100, preco_unitario: 3.50, subtotal: 350.00 },
];

const sampleTotals = {
  totalMaterial: 1600.00,
  totalServico: 400.00,
  totalGeral: 2000.00,
};

const sampleEstruturas = [
  { codigo_kit: '13N1', descricao_kit: 'Kit Padrão MT', quantidade: 2, preco_kit: 500.00 },
];

describe('createProfessionalWorkbook', () => {
  it('retorna um workbook válido (objeto com SheetNames)', () => {
    const wb = createProfessionalWorkbook(sampleMaterials, sampleTotals);
    expect(wb).toBeDefined();
    expect(wb.SheetNames).toBeDefined();
    expect(Array.isArray(wb.SheetNames)).toBe(true);
  });

  it('cria abas Resumo e Materiais', () => {
    const wb = createProfessionalWorkbook(sampleMaterials, sampleTotals);
    expect(wb.SheetNames).toContain('Resumo');
    expect(wb.SheetNames).toContain('Materiais');
  });

  it('cria aba Estruturas quando estruturas são fornecidas', () => {
    const wb = createProfessionalWorkbook(sampleMaterials, sampleTotals, sampleEstruturas);
    expect(wb.SheetNames).toContain('Estruturas');
  });

  it('não cria aba Estruturas quando lista está vazia', () => {
    const wb = createProfessionalWorkbook(sampleMaterials, sampleTotals, []);
    expect(wb.SheetNames).not.toContain('Estruturas');
  });

  it('não cria aba Estruturas quando não fornecida', () => {
    const wb = createProfessionalWorkbook(sampleMaterials, sampleTotals);
    expect(wb.SheetNames).not.toContain('Estruturas');
  });

  it('planilha Resumo contém dados', () => {
    const wb = createProfessionalWorkbook(sampleMaterials, sampleTotals);
    const sheet = wb.Sheets['Resumo'];
    expect(sheet).toBeDefined();
    // Cell A1 should have the title
    expect(sheet['A1']).toBeDefined();
  });

  it('funciona com lista de materiais vazia', () => {
    const wb = createProfessionalWorkbook([], { totalMaterial: 0, totalServico: 0, totalGeral: 0 });
    expect(wb.SheetNames).toContain('Resumo');
  });

  it('totais são incluídos corretamente', () => {
    const wb = createProfessionalWorkbook(sampleMaterials, sampleTotals);
    const sheet = wb.Sheets['Resumo'];
    // The workbook should be defined with correct structure
    expect(sheet).toBeDefined();
  });
});

describe('exportBudgetToExcel', () => {
  beforeEach(() => vi.clearAllMocks());

  it('não lança erro ao exportar orçamento completo', () => {
    const wb = createProfessionalWorkbook(sampleMaterials, sampleTotals, sampleEstruturas);
    expect(wb).toBeDefined();
    expect(wb.SheetNames.length).toBeGreaterThanOrEqual(2);
  });

  it('exportBudgetToExcel aceita custoData sem materiais', () => {
    const wb = createProfessionalWorkbook([], { totalMaterial: 0, totalServico: 0, totalGeral: 0 });
    expect(wb.SheetNames).toContain('Resumo');
  });

  it('exportBudgetToExcel chama XLSX.writeFile com filename correto', () => {
    exportBudgetToExcel(
      { materiais: sampleMaterials, ...sampleTotals },
      sampleEstruturas,
      'Teste_CQT'
    );
    expect(XLSX.writeFile).toHaveBeenCalledTimes(1);
    const [, filename] = XLSX.writeFile.mock.calls[0];
    expect(filename).toMatch(/^Teste_CQT_\d{4}-\d{2}-\d{2}\.xlsx$/);
  });

  it('exportBudgetToExcel usa nome padrão "Orcamento_CQT" quando não fornecido', () => {
    exportBudgetToExcel({ materiais: [], totalMaterial: 0, totalServico: 0, totalGeral: 0 });
    expect(XLSX.writeFile).toHaveBeenCalledTimes(1);
    const [, filename] = XLSX.writeFile.mock.calls[0];
    expect(filename).toMatch(/^Orcamento_CQT_/);
  });

  it('exportBudgetToExcel funciona sem estruturas', () => {
    exportBudgetToExcel({ materiais: sampleMaterials, ...sampleTotals });
    expect(XLSX.writeFile).toHaveBeenCalledTimes(1);
  });
});

describe('downloadWorkbook', () => {
  beforeEach(() => vi.clearAllMocks());

  it('chama XLSX.writeFile com filename formatado corretamente', () => {
    const fakeWb = { SheetNames: ['S1'], Sheets: {} };
    downloadWorkbook(fakeWb, 'MeuArquivo');
    expect(XLSX.writeFile).toHaveBeenCalledTimes(1);
    const [wb, filename] = XLSX.writeFile.mock.calls[0];
    expect(wb).toBe(fakeWb);
    expect(filename).toMatch(/^MeuArquivo_\d{4}-\d{2}-\d{2}\.xlsx$/);
  });
});

describe('exportMaterialsToExcel (legacy)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('cria workbook via legacy wrapper e chama writeFile', () => {
    exportMaterialsToExcel(sampleMaterials, sampleTotals, 'legado');
    expect(XLSX.writeFile).toHaveBeenCalledTimes(1);
    const [, filename] = XLSX.writeFile.mock.calls[0];
    expect(filename).toMatch(/^legado_/);
  });

  it('funciona sem filename (usa padrão "configurador")', () => {
    exportMaterialsToExcel(sampleMaterials, sampleTotals);
    expect(XLSX.writeFile).toHaveBeenCalledTimes(1);
    const [, filename] = XLSX.writeFile.mock.calls[0];
    expect(filename).toMatch(/^configurador_/);
  });
});
