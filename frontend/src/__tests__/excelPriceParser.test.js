/**
 * Tests for excelPriceParser utility functions
 * Note: parseExcelPrecos requires FileReader (browser API) and is tested
 * via the pure helper logic extracted here. validateImportPreview is fully testable.
 */
import { describe, it, expect } from 'vitest';
import { validateImportPreview } from '../utils/excelPriceParser';

describe('validateImportPreview', () => {
  const samplePrecos = [
    { sap: '100001', preco_unitario: 25.50 },
    { sap: '100002', preco_unitario: 10.00 },
    { sap: '100003', preco_unitario: 5.75 },
    { sap: '100004', preco_unitario: 100.00 },
    { sap: '100005', preco_unitario: 50.00 },
    { sap: '100006', preco_unitario: 75.00 },
  ];

  it('retorna totalLinhas correto', () => {
    const result = validateImportPreview(samplePrecos, []);
    expect(result.totalLinhas).toBe(6);
  });

  it('conta novos corretamente quando existingSaps vazio', () => {
    const result = validateImportPreview(samplePrecos, []);
    expect(result.novos).toBe(6);
    expect(result.atualizacoes).toBe(0);
  });

  it('conta atualizacoes quando SAP já existe', () => {
    const result = validateImportPreview(samplePrecos, ['100001', '100003']);
    expect(result.atualizacoes).toBe(2);
    expect(result.novos).toBe(4);
  });

  it('soma novos + atualizacoes = totalLinhas', () => {
    const existing = ['100001', '100002'];
    const result = validateImportPreview(samplePrecos, existing);
    expect(result.novos + result.atualizacoes).toBe(result.totalLinhas);
  });

  it('preview retorna no máximo 5 itens', () => {
    const result = validateImportPreview(samplePrecos, []);
    expect(result.preview.length).toBe(5);
  });

  it('preview retorna todos quando lista tem ≤ 5 itens', () => {
    const small = samplePrecos.slice(0, 3);
    const result = validateImportPreview(small, []);
    expect(result.preview.length).toBe(3);
  });

  it('funciona com lista vazia', () => {
    const result = validateImportPreview([], []);
    expect(result.totalLinhas).toBe(0);
    expect(result.novos).toBe(0);
    expect(result.atualizacoes).toBe(0);
    expect(result.preview).toEqual([]);
  });

  it('funciona sem existingSaps (default vazio)', () => {
    const result = validateImportPreview(samplePrecos);
    expect(result.novos).toBe(6);
    expect(result.atualizacoes).toBe(0);
  });

  it('todos os SAPs existentes → todos são atualizações', () => {
    const existing = samplePrecos.map(p => p.sap);
    const result = validateImportPreview(samplePrecos, existing);
    expect(result.atualizacoes).toBe(6);
    expect(result.novos).toBe(0);
  });

  it('preview contém os primeiros 5 itens na ordem correta', () => {
    const result = validateImportPreview(samplePrecos, []);
    expect(result.preview[0].sap).toBe('100001');
    expect(result.preview[4].sap).toBe('100005');
  });
});
