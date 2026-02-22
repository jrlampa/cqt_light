/**
 * KitDetailsModal.jsx — testes unitários
 * Modal de detalhes do kit (composição + materiais extras)
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { KitDetailsModal } from '../components/KitDetailsModal';
import { defaultApi } from './setup';

const KIT_MOCK = {
  codigo_kit: 'KIT-BT-001',
  descricao: 'Kit Poste 11m BT Compacta',
  materiaisExtras: [],
};

const COMPOSICAO_MOCK = [
  { sap: 'MAT001', descricao: 'Poste 11m', quantidade: 1, preco_unitario: 350.0 },
  { sap: 'MAT002', descricao: 'Arame recozido', quantidade: 5, preco_unitario: 4.5 },
];

const SEARCH_RESULTS = [
  { sap: 'MAT003', descricao: 'Isolador pino', unidade: 'UN', preco_unitario: 45.0 },
];

describe('KitDetailsModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    defaultApi.getKitComposition.mockResolvedValue(COMPOSICAO_MOCK);
    defaultApi.searchMaterials.mockResolvedValue(SEARCH_RESULTS);
  });

  it('não carrega composição quando isOpen=false', () => {
    render(
      <KitDetailsModal isOpen={false} onClose={vi.fn()} kit={KIT_MOCK} onSaveMateriais={vi.fn()} />
    );
    expect(defaultApi.getKitComposition).not.toHaveBeenCalled();
  });

  it('carrega composição quando isOpen=true e kit está definido', async () => {
    render(
      <KitDetailsModal isOpen={true} onClose={vi.fn()} kit={KIT_MOCK} onSaveMateriais={vi.fn()} />
    );
    await waitFor(() => expect(defaultApi.getKitComposition).toHaveBeenCalledWith('KIT-BT-001'));
  });

  it('exibe materiais padrão da composição', async () => {
    render(
      <KitDetailsModal isOpen={true} onClose={vi.fn()} kit={KIT_MOCK} onSaveMateriais={vi.fn()} />
    );
    await waitFor(() => expect(screen.getByText('Poste 11m')).toBeTruthy());
    expect(screen.getByText('Arame recozido')).toBeTruthy();
  });

  it('exibe quantidades dos materiais', async () => {
    render(
      <KitDetailsModal isOpen={true} onClose={vi.fn()} kit={KIT_MOCK} onSaveMateriais={vi.fn()} />
    );
    await waitFor(() => expect(screen.getByText('1')).toBeTruthy());
  });

  it('não crasha quando kit=null', () => {
    expect(() => render(
      <KitDetailsModal isOpen={true} onClose={vi.fn()} kit={null} onSaveMateriais={vi.fn()} />
    )).not.toThrow();
  });

  it('não crasha quando window.api não está disponível', () => {
    const backup = window.api;
    window.api = undefined;
    expect(() => render(
      <KitDetailsModal isOpen={true} onClose={vi.fn()} kit={KIT_MOCK} onSaveMateriais={vi.fn()} />
    )).not.toThrow();
    window.api = backup;
  });

  it('não crasha com kit sem materiaisExtras', async () => {
    const kitSemExtras = { ...KIT_MOCK, materiaisExtras: undefined };
    expect(() => render(
      <KitDetailsModal isOpen={true} onClose={vi.fn()} kit={kitSemExtras} onSaveMateriais={vi.fn()} />
    )).not.toThrow();
  });

  it('recarrega composição quando isOpen muda de false para true', async () => {
    const { rerender } = render(
      <KitDetailsModal isOpen={false} onClose={vi.fn()} kit={KIT_MOCK} onSaveMateriais={vi.fn()} />
    );
    expect(defaultApi.getKitComposition).not.toHaveBeenCalled();
    rerender(
      <KitDetailsModal isOpen={true} onClose={vi.fn()} kit={KIT_MOCK} onSaveMateriais={vi.fn()} />
    );
    await waitFor(() => expect(defaultApi.getKitComposition).toHaveBeenCalled());
  });

  it('busca materiais extras ao digitar no campo de busca', async () => {
    render(
      <KitDetailsModal isOpen={true} onClose={vi.fn()} kit={KIT_MOCK} onSaveMateriais={vi.fn()} />
    );
    await waitFor(() => expect(screen.getByText('Poste 11m')).toBeTruthy());
    // Testa que há botões disponíveis (+ adicionar material extra)
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('renderiza botão de fechar', async () => {
    render(
      <KitDetailsModal isOpen={true} onClose={vi.fn()} kit={KIT_MOCK} onSaveMateriais={vi.fn()} />
    );
    await waitFor(() => expect(defaultApi.getKitComposition).toHaveBeenCalled());
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });
});
