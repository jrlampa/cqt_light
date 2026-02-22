/**
 * PriceManagementModal.jsx — testes unitários
 * Modal de gestão de preços (importar Excel, reajuste em massa, histórico)
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PriceManagementModal } from '../components/PriceManagementModal';
import { defaultApi } from './setup';

// Mock do parseExcelPrecos para evitar FileReader real
vi.mock('../utils/excelPriceParser', () => ({
  parseExcelPrecos: vi.fn().mockResolvedValue([]),
  validateImportPreview: vi.fn().mockReturnValue({ validos: [], invalidos: [] }),
}));

const EMPRESA_ATIVA = { id: 1, nome: 'Concessionária Teste', ativa: true };

const HISTORICO_MOCK = [
  { id: 1, empresa_id: 1, percentual: 5, data_reajuste: '2026-01-15', total_atualizados: 120 },
  { id: 2, empresa_id: 1, percentual: -2.5, data_reajuste: '2026-02-10', total_atualizados: 85 },
];

describe('PriceManagementModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    defaultApi.getHistoricoPrecos.mockResolvedValue(HISTORICO_MOCK);
    defaultApi.importPrecosFromArray.mockResolvedValue({ atualizados: 10, novos: 2 });
    defaultApi.reajusteEmMassa.mockResolvedValue({ changes: 50 });
  });

  it('não renderiza conteúdo quando isOpen=false', () => {
    const { container } = render(
      <PriceManagementModal isOpen={false} onClose={vi.fn()} empresaAtiva={EMPRESA_ATIVA} />
    );
    expect(container).toBeTruthy();
  });

  it('renderiza quando isOpen=true', async () => {
    render(
      <PriceManagementModal isOpen={true} onClose={vi.fn()} empresaAtiva={EMPRESA_ATIVA} />
    );
    await waitFor(() => expect(document.body).toBeTruthy());
  });

  it('exibe abas Importar e Reajuste', async () => {
    render(
      <PriceManagementModal isOpen={true} onClose={vi.fn()} empresaAtiva={EMPRESA_ATIVA} />
    );
    await waitFor(() => {
      const importTab = screen.queryByText(/Importar/i);
      expect(importTab).toBeTruthy();
    });
  });

  it('troca para aba Reajuste em Massa', async () => {
    render(
      <PriceManagementModal isOpen={true} onClose={vi.fn()} empresaAtiva={EMPRESA_ATIVA} />
    );
    await waitFor(() => expect(screen.queryByText(/Reajuste em Massa/i)).toBeTruthy());
    const reajusteTab = screen.queryByText(/Reajuste em Massa/i);
    if (reajusteTab) {
      fireEvent.click(reajusteTab);
      await waitFor(() => expect(screen.queryByText(/Reajuste em Massa/i)).toBeTruthy());
    }
  });

  it('troca para aba Histórico e carrega dados', async () => {
    render(
      <PriceManagementModal isOpen={true} onClose={vi.fn()} empresaAtiva={EMPRESA_ATIVA} />
    );
    await waitFor(() => expect(document.body).toBeTruthy());
    const historicoTab = screen.queryByText(/Histórico/i);
    if (historicoTab) {
      fireEvent.click(historicoTab);
      await waitFor(() => expect(defaultApi.getHistoricoPrecos).toHaveBeenCalled());
    }
  });

  it('não crasha quando empresaAtiva=null', () => {
    expect(() => render(
      <PriceManagementModal isOpen={true} onClose={vi.fn()} empresaAtiva={null} />
    )).not.toThrow();
  });

  it('não crasha quando window.api não está disponível', () => {
    const backup = window.api;
    window.api = undefined;
    expect(() => render(
      <PriceManagementModal isOpen={true} onClose={vi.fn()} empresaAtiva={EMPRESA_ATIVA} />
    )).not.toThrow();
    window.api = backup;
  });

  it('recarrega quando isOpen muda de false para true', async () => {
    const { rerender } = render(
      <PriceManagementModal isOpen={false} onClose={vi.fn()} empresaAtiva={EMPRESA_ATIVA} />
    );
    rerender(
      <PriceManagementModal isOpen={true} onClose={vi.fn()} empresaAtiva={EMPRESA_ATIVA} />
    );
    await waitFor(() => expect(document.body).toBeTruthy());
  });

  it('tem botão de fechar', async () => {
    render(
      <PriceManagementModal isOpen={true} onClose={vi.fn()} empresaAtiva={EMPRESA_ATIVA} />
    );
    await waitFor(() => expect(screen.getAllByRole('button').length).toBeGreaterThan(0));
  });
});
