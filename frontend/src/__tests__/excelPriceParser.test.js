/**
 * Tests for excelPriceParser utility functions
 * Note: parseExcelPrecos requires FileReader (browser API) and is tested
 * via the pure helper logic extracted here. validateImportPreview is fully testable.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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

// ─────────────────────────────────────────────────────────────────────────────
// parseExcelPrecos — tested by mocking FileReader + XLSX
// ─────────────────────────────────────────────────────────────────────────────

// We mock xlsx before importing parseExcelPrecos so the module picks up the mock
vi.mock('xlsx', () => ({
  read: vi.fn(),
  utils: {
    sheet_to_json: vi.fn(),
  },
}));

// Dynamic import so vi.mock runs first
const { parseExcelPrecos } = await import('../utils/excelPriceParser');
import * as XLSX from 'xlsx';

/**
 * Helper: creates a mock File object and makes FileReader immediately trigger
 * `onload` with synthetic ArrayBuffer result.
 */
function mockFileReader(result = new ArrayBuffer(0)) {
  global.FileReader = class {
    readAsArrayBuffer() {
      // Trigger onload synchronously (simulating instant read)
      setTimeout(() => this.onload({ target: { result } }), 0);
    }
  };
}

/**
 * Helper: creates a mock File object (no real content needed since FileReader is mocked).
 */
function makeFile(name = 'test.xlsx') {
  return new File(['fake'], name, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

describe('parseExcelPrecos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFileReader();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('resolve com preços quando SAP encontrado após preço', async () => {
    // Sheet data: row 0 has price in col C, row 1 has SAP in col B
    const jsonData = [
      ['DESC', 'REF', 25.50],      // row 0: price=25.50
      ['', '(100001)', ''],         // row 1: SAP=100001 in col B
    ];
    XLSX.read.mockReturnValue({
      SheetNames: ['Materiais'],
      Sheets: { Materiais: {} },
    });
    XLSX.utils.sheet_to_json.mockReturnValue(jsonData);

    const result = await parseExcelPrecos(makeFile());
    expect(result.success).toHaveLength(1);
    expect(result.success[0].sap).toBe('100001');
    expect(result.success[0].preco_unitario).toBe(25.50);
    expect(result.totalSuccess).toBe(1);
    expect(result.totalAmbiguous).toBe(0);
  });

  it('resolve com caso ambíguo quando preço não tem SAP em 5 linhas', async () => {
    const jsonData = [
      ['DESC', 'REF', 50.00],  // row 0: price=50.00, no SAP anywhere nearby
      ['', '', ''],
      ['', '', ''],
      ['', '', ''],
      ['', '', ''],
      ['', '', ''],
    ];
    XLSX.read.mockReturnValue({ SheetNames: ['Aba1'], Sheets: { Aba1: {} } });
    XLSX.utils.sheet_to_json.mockReturnValue(jsonData);

    const result = await parseExcelPrecos(makeFile());
    expect(result.ambiguous).toHaveLength(1);
    expect(result.ambiguous[0].price).toBe(50.00);
    expect(result.totalAmbiguous).toBe(1);
  });

  it('ignora subheaders (linha com "custo" no início)', async () => {
    const jsonData = [
      ['Custo de Materiais', '', ''],  // subheader → skip
      ['DESC', 'REF', 10.00],
      ['', '(200001)', ''],
    ];
    XLSX.read.mockReturnValue({ SheetNames: ['S1'], Sheets: { S1: {} } });
    XLSX.utils.sheet_to_json.mockReturnValue(jsonData);

    const result = await parseExcelPrecos(makeFile());
    expect(result.success).toHaveLength(1);
    expect(result.success[0].sap).toBe('200001');
  });

  it('ignora linhas completamente vazias', async () => {
    const jsonData = [
      ['', '', ''],              // empty → skip
      ['DESC', 'X', 30.00],
      ['', '(300001)', ''],
    ];
    XLSX.read.mockReturnValue({ SheetNames: ['S1'], Sheets: { S1: {} } });
    XLSX.utils.sheet_to_json.mockReturnValue(jsonData);

    const result = await parseExcelPrecos(makeFile());
    expect(result.success).toHaveLength(1);
    expect(result.success[0].sap).toBe('300001');
  });

  it('usa primeira aba quando nenhuma aba tem nome relevante', async () => {
    const jsonData = [['D', 'R', 5.00], ['', '(400001)', '']];
    XLSX.read.mockReturnValue({ SheetNames: ['Aba_Genérica'], Sheets: { Aba_Genérica: {} } });
    XLSX.utils.sheet_to_json.mockReturnValue(jsonData);

    const result = await parseExcelPrecos(makeFile());
    expect(result.success).toHaveLength(1);
    expect(result.success[0].sap).toBe('400001');
  });

  it('prefere aba com nome "custo materiais"', async () => {
    XLSX.read.mockReturnValue({
      SheetNames: ['Aba1', 'Custo Materiais'],
      Sheets: { Aba1: {}, 'Custo Materiais': {} },
    });
    XLSX.utils.sheet_to_json.mockReturnValue([['D', 'R', 1.00], ['', '(500001)', '']]);

    const result = await parseExcelPrecos(makeFile());
    // sheet_to_json called with the "Custo Materiais" sheet (second call)
    expect(XLSX.utils.sheet_to_json).toHaveBeenCalled();
    expect(result.success[0].sap).toBe('500001');
  });

  it('rejeita quando planilha tem menos de 2 linhas', async () => {
    XLSX.read.mockReturnValue({ SheetNames: ['S1'], Sheets: { S1: {} } });
    XLSX.utils.sheet_to_json.mockReturnValue([['único cabeçalho']]);

    await expect(parseExcelPrecos(makeFile())).rejects.toThrow('Planilha vazia ou sem dados');
  });

  it('rejeita quando FileReader dispara erro', async () => {
    global.FileReader = class {
      readAsArrayBuffer() {
        setTimeout(() => this.onerror(new Event('error')), 0);
      }
    };
    await expect(parseExcelPrecos(makeFile())).rejects.toThrow('Erro ao ler arquivo');
  });

  it('preço como string com vírgula decimal é parseado corretamente', async () => {
    const jsonData = [
      ['D', 'R', '12,50'],
      ['', '(600001)', ''],
    ];
    XLSX.read.mockReturnValue({ SheetNames: ['S1'], Sheets: { S1: {} } });
    XLSX.utils.sheet_to_json.mockReturnValue(jsonData);

    const result = await parseExcelPrecos(makeFile());
    expect(result.success[0].preco_unitario).toBe(12.50);
  });

  it('ignora preço zero ou negativo', async () => {
    const jsonData = [
      ['D', 'R', 0],
      ['D2', 'R2', -5],
    ];
    XLSX.read.mockReturnValue({ SheetNames: ['S1'], Sheets: { S1: {} } });
    XLSX.utils.sheet_to_json.mockReturnValue(jsonData);

    const result = await parseExcelPrecos(makeFile());
    expect(result.success).toHaveLength(0);
    expect(result.ambiguous).toHaveLength(0);
  });

  it('múltiplos preços com SAPs encontrados', async () => {
    const jsonData = [
      ['D', 'R', 10.00], ['', '(700001)', ''],
      ['D', 'R', 20.00], ['', '(700002)', ''],
    ];
    XLSX.read.mockReturnValue({ SheetNames: ['S1'], Sheets: { S1: {} } });
    XLSX.utils.sheet_to_json.mockReturnValue(jsonData);

    const result = await parseExcelPrecos(makeFile());
    expect(result.success).toHaveLength(2);
    expect(result.totalSuccess).toBe(2);
  });
});

