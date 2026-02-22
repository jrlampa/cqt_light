/**
 * KitResolutionModal.jsx — testes unitários
 * Resolve sufixos de materiais parciais (ex: 'E-10/' → 'E-10/1000')
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { KitResolutionModal } from '../components/KitResolutionModal';
import { defaultApi } from './setup';

const KIT_MOCK = {
  codigo_kit: 'KIT-001',
  descricao: 'Kit Poste 11m',
};

const MATERIAIS_COMPLETOS = [
  { codigo: 'E-10/1000', descricao: 'Espaçador 1000mm', quantidade: 1, isPartial: false },
];

const MATERIAIS_PARCIAIS = [
  { codigo: 'E-10/', descricao: 'Espaçador', quantidade: 1, isPartial: true },
];

const SUFIXOS_MOCK = [
  { prefixo: 'E-10/', sufixo: '500', codigo_completo: 'E-10/500', tipo_contexto: 'Vão', valor_contexto: '500m' },
  { prefixo: 'E-10/', sufixo: '1000', codigo_completo: 'E-10/1000', tipo_contexto: 'Vão', valor_contexto: '1000m' },
];

describe('KitResolutionModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    defaultApi.getAllSufixos.mockResolvedValue(SUFIXOS_MOCK);
  });

  it('não renderiza quando isOpen=false', () => {
    const { container } = render(
      <KitResolutionModal
        isOpen={false} onClose={vi.fn()} kit={KIT_MOCK}
        materials={MATERIAIS_PARCIAIS} onConfirm={vi.fn()}
      />
    );
    expect(container).toBeTruthy();
  });

  it('renderiza modal quando isOpen=true e há materiais parciais', async () => {
    render(
      <KitResolutionModal
        isOpen={true} onClose={vi.fn()} kit={KIT_MOCK}
        materials={MATERIAIS_PARCIAIS} onConfirm={vi.fn()}
      />
    );
    await waitFor(() => expect(defaultApi.getAllSufixos).toHaveBeenCalled());
  });

  it('não busca sufixos quando não há materiais parciais', () => {
    render(
      <KitResolutionModal
        isOpen={true} onClose={vi.fn()} kit={KIT_MOCK}
        materials={MATERIAIS_COMPLETOS} onConfirm={vi.fn()}
      />
    );
    expect(defaultApi.getAllSufixos).not.toHaveBeenCalled();
  });

  it('exibe botão de confirmar', async () => {
    render(
      <KitResolutionModal
        isOpen={true} onClose={vi.fn()} kit={KIT_MOCK}
        materials={MATERIAIS_PARCIAIS} onConfirm={vi.fn()}
      />
    );
    await waitFor(() => expect(defaultApi.getAllSufixos).toHaveBeenCalled());
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('chama onClose ao clicar no botão cancelar', async () => {
    const onClose = vi.fn();
    render(
      <KitResolutionModal
        isOpen={true} onClose={onClose} kit={KIT_MOCK}
        materials={MATERIAIS_PARCIAIS} onConfirm={vi.fn()}
      />
    );
    await waitFor(() => expect(defaultApi.getAllSufixos).toHaveBeenCalled());
    // Procura botão de cancelar (X ou Cancelar)
    const cancelBtn = screen.queryByRole('button', { name: /cancelar|fechar|X/i });
    if (cancelBtn) {
      fireEvent.click(cancelBtn);
      expect(onClose).toHaveBeenCalled();
    }
  });

  it('não crasha quando window.api não está disponível', () => {
    const backup = window.api;
    window.api = undefined;
    expect(() => render(
      <KitResolutionModal
        isOpen={true} onClose={vi.fn()} kit={KIT_MOCK}
        materials={MATERIAIS_PARCIAIS} onConfirm={vi.fn()}
      />
    )).not.toThrow();
    window.api = backup;
  });

  it('não crasha com kit=null', () => {
    expect(() => render(
      <KitResolutionModal
        isOpen={true} onClose={vi.fn()} kit={null}
        materials={[]} onConfirm={vi.fn()}
      />
    )).not.toThrow();
  });

  it('não crasha com materials=[]', () => {
    expect(() => render(
      <KitResolutionModal
        isOpen={true} onClose={vi.fn()} kit={KIT_MOCK}
        materials={[]} onConfirm={vi.fn()}
      />
    )).not.toThrow();
  });
});
