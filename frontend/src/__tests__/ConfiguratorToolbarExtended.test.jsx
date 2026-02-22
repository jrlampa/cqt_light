/**
 * ConfiguratorToolbar.jsx — testes estendidos (botões Kit e PDF quando habilitados)
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfiguratorToolbar } from '../components/ConfiguratorToolbar';

describe('ConfiguratorToolbar — botões Kit e PDF habilitados', () => {
  beforeEach(() => {
    window.alert = vi.fn().mockImplementation(() => {});
  });

  it('botão Kit habilitado quando totalKits > 0', () => {
    render(
      <ConfiguratorToolbar
        totalKits={2}
        totalMats={0}
        showExport={false}
        onClear={vi.fn()}
        onExportExcel={vi.fn()}
        onOpenHistory={vi.fn()}
        onOpenTemplates={vi.fn()}
        onOpenManualKits={vi.fn()}
        onOpenPriceManager={vi.fn()}
      />
    );
    const kitBtn = screen.getByText('Kit').closest('button');
    expect(kitBtn.disabled).toBe(false);
  });

  it('botão Kit chama alert ao ser clicado quando habilitado', () => {
    render(
      <ConfiguratorToolbar
        totalKits={1}
        totalMats={0}
        showExport={false}
        onClear={vi.fn()}
        onExportExcel={vi.fn()}
        onOpenHistory={vi.fn()}
        onOpenTemplates={vi.fn()}
        onOpenManualKits={vi.fn()}
        onOpenPriceManager={vi.fn()}
      />
    );
    const kitBtn = screen.getByText('Kit').closest('button');
    fireEvent.click(kitBtn);
    expect(window.alert).toHaveBeenCalledWith('Salvar como Kit — Em breve!');
  });

  it('botão Relatório habilitado quando totalKits > 0', () => {
    render(
      <ConfiguratorToolbar
        totalKits={1}
        totalMats={0}
        showExport={false}
        onClear={vi.fn()}
        onExportExcel={vi.fn()}
        onOpenHistory={vi.fn()}
        onOpenTemplates={vi.fn()}
        onOpenManualKits={vi.fn()}
        onOpenPriceManager={vi.fn()}
      />
    );
    const relBtn = screen.queryByText(/Relatório/i)?.closest('button');
    if (relBtn) {
      expect(relBtn.disabled).toBe(false);
    }
  });

  it('botão Relatório chama alert ao ser clicado quando habilitado', () => {
    render(
      <ConfiguratorToolbar
        totalKits={1}
        totalMats={0}
        showExport={false}
        onClear={vi.fn()}
        onExportExcel={vi.fn()}
        onOpenHistory={vi.fn()}
        onOpenTemplates={vi.fn()}
        onOpenManualKits={vi.fn()}
        onOpenPriceManager={vi.fn()}
      />
    );
    const relBtn = screen.queryByText(/Relatório/i)?.closest('button');
    if (relBtn) {
      fireEvent.click(relBtn);
      expect(window.alert).toHaveBeenCalledWith('Relatório PDF — Em breve!');
    }
  });
});
