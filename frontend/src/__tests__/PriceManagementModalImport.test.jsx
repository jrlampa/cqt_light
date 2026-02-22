/**
 * PriceManagementModal.jsx — testes de importação e ambiguous preview
 * Cobre: linha 108 (erro reajuste), linha 145 (tab import re-click), linhas 237-244 (ambiguous map)
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { PriceManagementModal } from '../components/PriceManagementModal';
import { defaultApi } from './setup';

const { parseExcelPrecos, validateImportPreview } = await vi.importMock('../utils/excelPriceParser');

vi.mock('../utils/excelPriceParser', () => ({
  parseExcelPrecos: vi.fn(),
  validateImportPreview: vi.fn(),
}));

const EMPRESA = { id: 3, nome: 'Distribuidora Sul', regional: 'RS', ativa: true };

describe('PriceManagementModal — importação e ambiguous', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.alert = vi.fn().mockImplementation(() => {});
    window.confirm = vi.fn().mockReturnValue(true);
    defaultApi.getHistoricoPrecos.mockResolvedValue([]);
    defaultApi.getAllMaterials.mockResolvedValue([{ sap: 'SAP001' }]);
    defaultApi.importPrecosFromArray.mockResolvedValue(3);
    defaultApi.reajusteEmMassa.mockResolvedValue(50);
    parseExcelPrecos.mockResolvedValue({ success: [], ambiguous: [] });
    validateImportPreview.mockReturnValue({
      totalLinhas: 0,
      novos: 0,
      atualizacoes: 0,
    });
  });

  it('cobre linha 108: exibe alert de erro quando reajusteEmMassa rejeita', async () => {
    defaultApi.reajusteEmMassa.mockRejectedValue(new Error('DB error'));
    render(<PriceManagementModal isOpen={true} onClose={vi.fn()} empresaAtiva={EMPRESA} />);

    // Vai para aba de reajuste
    await waitFor(() => expect(screen.queryByText(/Reajuste em Massa/i)).toBeTruthy());
    fireEvent.click(screen.getByText(/Reajuste em Massa/i));
    await waitFor(() => expect(screen.queryByPlaceholderText(/5\.5/i)).toBeTruthy());

    // Preenche percentual e clica
    fireEvent.change(screen.getByPlaceholderText(/5\.5/i), { target: { value: '10' } });
    const applyBtn = screen.getByText(/Aplicar Reajuste/i);
    await act(async () => {
      fireEvent.click(applyBtn);
    });

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(
        expect.stringContaining('Erro ao aplicar reajuste')
      );
    });
  });

  it('cobre linha 145: re-clique na aba Importar Excel após trocar de aba', async () => {
    render(<PriceManagementModal isOpen={true} onClose={vi.fn()} empresaAtiva={EMPRESA} />);

    await waitFor(() => expect(screen.queryByText(/Reajuste em Massa/i)).toBeTruthy());

    // Troca para aba Reajuste
    fireEvent.click(screen.getByText(/Reajuste em Massa/i));
    await waitFor(() => expect(screen.queryByPlaceholderText(/5\.5/i)).toBeTruthy());

    // Volta para aba Importar Excel — cobre linha 145
    fireEvent.click(screen.getByText(/Importar Excel/i));
    await waitFor(() =>
      expect(screen.queryByText(/Selecionar Arquivo Excel/i)).toBeTruthy()
    );
  });

  it('cobre linhas 237-244: renderiza mapa de ambiguous quando há itens ambíguos', async () => {
    const ambiguousItems = [
      {
        lineNum: 5,
        price: 125.50,
        context: [
          { lineNum: 3, content: 'POSTE DE CONCRETO' },
          { lineNum: 4, content: '' },
          { lineNum: 5, content: 'R$ 125,50' },
        ],
      },
      {
        lineNum: 12,
        price: 89.00,
        context: [
          { lineNum: 10, content: 'TRANSFORMADOR 30KVA' },
          { lineNum: 11, content: '' },
          { lineNum: 12, content: 'R$ 89,00' },
        ],
      },
    ];

    parseExcelPrecos.mockResolvedValue({
      success: [{ sap: 'SAP999', preco: 50 }],
      ambiguous: ambiguousItems,
    });
    validateImportPreview.mockReturnValue({
      totalLinhas: 1,
      novos: 1,
      atualizacoes: 0,
    });

    render(<PriceManagementModal isOpen={true} onClose={vi.fn()} empresaAtiva={EMPRESA} />);
    await waitFor(() => expect(screen.queryByText(/Selecionar Arquivo Excel/i)).toBeTruthy());

    // Simula seleção de arquivo
    const fileInput = document.querySelector('input[type="file"]');
    const file = new File([''], 'precos.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    // Espera o preview ser exibido (linhas 237-244 são executadas)
    await waitFor(() =>
      expect(screen.queryByText(/Casos Ambíguos/i)).toBeTruthy()
    );

    // Verifica que os itens do ambiguous foram renderizados (linha 237-239)
    expect(screen.queryByText(/Linha 5/i)).toBeTruthy();
    expect(screen.queryByText(/125\.50/i) || screen.queryByText(/125,50/i)).toBeTruthy();
  });

  it('exibe botão Importar após preview com sucesso', async () => {
    parseExcelPrecos.mockResolvedValue({
      success: [{ sap: 'SAP001', preco: 100 }],
      ambiguous: [],
    });
    validateImportPreview.mockReturnValue({
      totalLinhas: 1,
      novos: 1,
      atualizacoes: 0,
    });

    render(<PriceManagementModal isOpen={true} onClose={vi.fn()} empresaAtiva={EMPRESA} />);
    await waitFor(() => expect(screen.queryByText(/Selecionar Arquivo Excel/i)).toBeTruthy());

    const fileInput = document.querySelector('input[type="file"]');
    const file = new File([''], 'precos.xlsx', { type: 'application/octet-stream' });
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    await waitFor(() => expect(screen.queryByText(/Detecção Automática/i)).toBeTruthy());
  });

  it('exibe alert de erro quando parseExcelPrecos rejeita (catch em handleFileSelect)', async () => {
    parseExcelPrecos.mockRejectedValue(new Error('Parse failed'));

    render(<PriceManagementModal isOpen={true} onClose={vi.fn()} empresaAtiva={EMPRESA} />);
    await waitFor(() => expect(screen.queryByText(/Selecionar Arquivo Excel/i)).toBeTruthy());

    const fileInput = document.querySelector('input[type="file"]');
    const file = new File([''], 'bad.xlsx', { type: 'application/octet-stream' });
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    await waitFor(() =>
      expect(window.alert).toHaveBeenCalledWith(
        expect.stringContaining('Erro ao processar arquivo')
      )
    );
  });

  it('renderiza contexto dos ambiguous com conteúdo vazio como "(vazia)"', async () => {
    const ambiguousItems = [
      {
        lineNum: 7,
        price: 200.00,
        context: [
          { lineNum: 5, content: '' },
        ],
      },
    ];
    parseExcelPrecos.mockResolvedValue({
      success: [],
      ambiguous: ambiguousItems,
    });
    validateImportPreview.mockReturnValue({
      totalLinhas: 0,
      novos: 0,
      atualizacoes: 0,
    });

    render(<PriceManagementModal isOpen={true} onClose={vi.fn()} empresaAtiva={EMPRESA} />);
    const fileInput = document.querySelector('input[type="file"]');
    const file = new File([''], 'test.xlsx', { type: 'application/octet-stream' });
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    await waitFor(() => expect(screen.queryByText(/vazia/i)).toBeTruthy());
  });
});
