/**
 * Tests for SummaryFooter component
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SummaryFooter } from '../components/SummaryFooter';

// Mock excelExporter
vi.mock('../utils/excelExporter', () => ({
  exportBudgetToExcel: vi.fn(),
}));

import { exportBudgetToExcel } from '../utils/excelExporter';

const baseCustoData = {
  materiais: [],
  totalMaterial: 1500,
  totalServico: 500,
  totalGeral: 2000,
};

const baseProps = {
  custoData: baseCustoData,
  condutorMT: { label: 'CAA 35mm² Nu' },
  condutorBT: { label: 'Multiplex 70mm²' },
  copySummary: vi.fn(),
  showBudgetHistory: false,
  setShowBudgetHistory: vi.fn(),
  estruturas: [],
};

describe('SummaryFooter', () => {
  it('renderiza null quando custoData é nulo', () => {
    const { container } = render(<SummaryFooter {...baseProps} custoData={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('exibe o total geral formatado em pt-BR', () => {
    render(<SummaryFooter {...baseProps} />);
    expect(screen.getAllByText(/R\$/).length).toBeGreaterThan(0);
    expect(screen.getByText(/TOTAL GERAL/i)).toBeTruthy();
  });

  it('exibe o nome do condutor MT', () => {
    render(<SummaryFooter {...baseProps} />);
    expect(screen.getByText('CAA 35mm² Nu')).toBeTruthy();
  });

  it('exibe o nome do condutor BT', () => {
    render(<SummaryFooter {...baseProps} />);
    expect(screen.getByText('Multiplex 70mm²')).toBeTruthy();
  });

  it('exibe texto padrão quando condutorMT é null', () => {
    render(<SummaryFooter {...baseProps} condutorMT={null} />);
    expect(screen.getByText('35mm² Nu (Padrão)')).toBeTruthy();
  });

  it('exibe texto padrão quando condutorBT é null', () => {
    render(<SummaryFooter {...baseProps} condutorBT={null} />);
    expect(screen.getByText('Multiplex 70mm² (Padrão)')).toBeTruthy();
  });

  it('botão Copiar chama copySummary', () => {
    render(<SummaryFooter {...baseProps} />);
    const botaoCopiar = screen.getByTitle(/Copiar Resumo/i);
    fireEvent.click(botaoCopiar);
    expect(baseProps.copySummary).toHaveBeenCalledTimes(1);
  });

  it('botão Excel chama exportBudgetToExcel', () => {
    render(<SummaryFooter {...baseProps} />);
    const botaoExcel = screen.getByTitle(/Baixar Excel/i);
    fireEvent.click(botaoExcel);
    expect(exportBudgetToExcel).toHaveBeenCalledTimes(1);
    expect(exportBudgetToExcel).toHaveBeenCalledWith(baseCustoData, [], 'Orcamento_CQT');
  });

  it('exibe rótulo Rede MT', () => {
    render(<SummaryFooter {...baseProps} />);
    expect(screen.getByText('Rede MT')).toBeTruthy();
  });

  it('exibe rótulo Rede BT', () => {
    render(<SummaryFooter {...baseProps} />);
    expect(screen.getByText('Rede BT')).toBeTruthy();
  });

  it('exibe atalho de teclado Ctrl+P', () => {
    render(<SummaryFooter {...baseProps} />);
    expect(screen.getByText(/Ctrl\+P/)).toBeTruthy();
  });
});
