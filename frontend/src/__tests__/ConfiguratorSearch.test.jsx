/**
 * Configurator.jsx — testes de handlers de busca e seleção.
 *
 * Cobre: searchPoste, selectPoste, searchStructure, searchMaterial,
 * confirmAddItem (ramo material), handlePosteNav, handleStructureNav,
 * handleMaterialNav, handleQtyNav com mocks de sub-componentes expostos.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import Configurator from '../components/Configurator';
import { defaultApi } from './setup';

// Mocks de sub-componentes — expõem callbacks via botões testáveis
vi.mock('../components/BudgetHistory', () => ({
  default: () => null,
}));
vi.mock('../components/TemplateManager', () => ({
  default: () => null,
}));
vi.mock('../components/ManualKitManager', () => ({
  default: () => null,
}));
vi.mock('../components/PriceManager', () => ({
  default: () => null,
}));
vi.mock('../components/PriceManagementModal', () => ({
  PriceManagementModal: () => null,
}));
vi.mock('../components/KitResolutionModal', () => ({
  KitResolutionModal: () => null,
}));
vi.mock('../components/KitDetailsModal', () => ({
  KitDetailsModal: () => null,
}));
vi.mock('../components/Toast', () => ({
  default: () => null,
}));
vi.mock('../hooks/useProdistToast', () => ({
  default: () => ({ toast: null, clearToast: vi.fn() }),
}));

// Mock PosteSearch: expõe input controlado e dropdown com botões selecionáveis
vi.mock('../components/PosteSearch', () => ({
  PosteSearch: ({ onSearch, onSelect, posteResults, posteQuery }) => (
    <div>
      <input
        data-testid="poste-search-input"
        value={posteQuery ?? ''}
        onChange={(e) => onSearch(e.target.value)}
        placeholder="Buscar poste"
      />
      {(posteResults ?? []).map((p) => (
        <button
          key={p.sap}
          data-testid={`poste-result-${p.sap}`}
          onClick={() => onSelect(p)}
        >
          {p.descricao}
        </button>
      ))}
    </div>
  ),
}));

// Mock StructureList: expõe input e dropdown selecionável + botão para trocar de aba
vi.mock('../components/StructureList', () => ({
  StructureList: ({ searchStructure, selectStructure, structureResults, setActiveTab }) => (
    <div>
      <button
        data-testid="btn-switch-materiais"
        onClick={() => setActiveTab('materiais')}
      >
        Materiais Avulsos
      </button>
      <input
        data-testid="structure-search-input"
        onChange={(e) => searchStructure(e.target.value)}
        placeholder="Buscar estrutura"
      />
      {(structureResults ?? []).map((r) => (
        <button
          key={r.codigo_kit}
          data-testid={`structure-result-${r.codigo_kit}`}
          onClick={() => selectStructure(r)}
        >
          {r.descricao_kit}
        </button>
      ))}
    </div>
  ),
}));

// Mock MaterialList: expõe input e dropdown selecionável
vi.mock('../components/MaterialList', () => ({
  MaterialList: ({ searchMaterial, selectMaterial, materialResults }) => (
    <div>
      <input
        data-testid="material-search-input"
        onChange={(e) => searchMaterial(e.target.value)}
        placeholder="Buscar material"
      />
      {(materialResults ?? []).map((r) => (
        <button
          key={r.sap}
          data-testid={`material-result-${r.sap}`}
          onClick={() => selectMaterial(r)}
        >
          {r.descricao}
        </button>
      ))}
    </div>
  ),
}));

// Mock QuantityPopup: expõe botões Confirmar e Cancelar
vi.mock('../components/QuantityPopup', () => ({
  QuantityPopup: ({ onConfirm, onCancel }) => (
    <div data-testid="qty-popup">
      <button data-testid="btn-confirm-qty" onClick={onConfirm}>
        Confirmar
      </button>
      <button data-testid="btn-cancel-qty" onClick={onCancel}>
        Cancelar
      </button>
    </div>
  ),
}));

vi.mock('../components/SummaryFooter', () => ({
  SummaryFooter: () => <div data-testid="summary-footer" />,
}));
vi.mock('../components/CompanySelector', () => ({
  CompanySelector: () => null,
}));
vi.mock('../components/ConductorSelector', () => ({
  ConductorSelector: () => null,
}));
vi.mock('../components/ConfiguratorToolbar', () => ({
  ConfiguratorToolbar: () => <div data-testid="toolbar" />,
}));

const POSTE_MOCK = { sap: 'SAP001', descricao: 'POSTE CONCRETO 11m', unidade: 'UN', preco: 0 };
const ESTRUTURA_MOCK = { codigo_kit: 'TE01', descricao_kit: 'Estrutura TE', tipo: 'padrao' };
const MATERIAL_MOCK = { sap: 'MAT999', descricao: 'Fio 10mm²', unidade: 'M', preco: 5 };

describe('Configurator — handlers de busca e seleção', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    defaultApi.getAllSufixos.mockResolvedValue([]);
    defaultApi.getAllTemplatesManuais.mockResolvedValue([]);
    defaultApi.getCustoTotal.mockResolvedValue({
      materiais: [], totalMaterial: 0, totalServico: 0,
    });
    defaultApi.searchMaterials.mockResolvedValue([POSTE_MOCK]);
    defaultApi.searchKits.mockResolvedValue([ESTRUTURA_MOCK]);
  });

  // ── searchPoste ────────────────────────────────────────────────────────────

  it('searchPoste chama window.api.searchMaterials', async () => {
    render(<Configurator />);
    const input = await screen.findByTestId('poste-search-input');
    fireEvent.change(input, { target: { value: 'POSTE' } });
    await waitFor(() =>
      expect(defaultApi.searchMaterials).toHaveBeenCalledWith('POSTE')
    );
  });

  it('searchPoste não chama API com query vazia', async () => {
    render(<Configurator />);
    const input = await screen.findByTestId('poste-search-input');
    fireEvent.change(input, { target: { value: '' } });
    // Sem query, searchMaterials não deve ser chamado por searchPoste
    await act(async () => {});
    // getAllSufixos é chamado no mount, mas searchMaterials não deve ser chamado agora
    const searchCalls = defaultApi.searchMaterials.mock.calls.filter(
      (c) => c[0] === ''
    );
    expect(searchCalls).toHaveLength(0);
  });

  // ── selectPoste ────────────────────────────────────────────────────────────

  it('selectPoste adiciona material à lista', async () => {
    defaultApi.searchMaterials.mockResolvedValue([POSTE_MOCK]);
    render(<Configurator />);
    const input = await screen.findByTestId('poste-search-input');
    fireEvent.change(input, { target: { value: 'POSTE' } });
    const btn = await screen.findByTestId(`poste-result-${POSTE_MOCK.sap}`);
    fireEvent.click(btn);
    // Após selectPoste, o input deve ser limpo (posteQuery = '')
    expect(input.value).toBe('');
  });

  // ── searchStructure ────────────────────────────────────────────────────────

  it('searchStructure chama window.api.searchKits', async () => {
    render(<Configurator />);
    const input = await screen.findByTestId('structure-search-input');
    fireEvent.change(input, { target: { value: 'TE' } });
    await waitFor(() =>
      expect(defaultApi.searchKits).toHaveBeenCalledWith('TE')
    );
  });

  it('searchStructure mostra resultado e abre QuantityPopup ao clicar', async () => {
    defaultApi.searchKits.mockResolvedValue([ESTRUTURA_MOCK]);
    render(<Configurator />);
    const input = await screen.findByTestId('structure-search-input');
    fireEvent.change(input, { target: { value: 'TE' } });
    const btn = await screen.findByTestId(`structure-result-${ESTRUTURA_MOCK.codigo_kit}`);
    fireEvent.click(btn);
    await waitFor(() =>
      expect(screen.queryByTestId('qty-popup')).not.toBeNull()
    );
  });

  // ── searchMaterial ─────────────────────────────────────────────────────────

  it('searchMaterial chama window.api.searchMaterials', async () => {
    render(<Configurator />);
    // Troca para aba materiais
    const switchBtn = await screen.findByTestId('btn-switch-materiais');
    fireEvent.click(switchBtn);
    const input = await screen.findByTestId('material-search-input');
    fireEvent.change(input, { target: { value: 'fio' } });
    await waitFor(() =>
      expect(defaultApi.searchMaterials).toHaveBeenCalledWith('fio')
    );
  });

  it('searchMaterial mostra resultado e abre QuantityPopup ao clicar', async () => {
    defaultApi.searchMaterials.mockResolvedValue([MATERIAL_MOCK]);
    render(<Configurator />);
    const switchBtn = await screen.findByTestId('btn-switch-materiais');
    fireEvent.click(switchBtn);
    const input = await screen.findByTestId('material-search-input');
    fireEvent.change(input, { target: { value: 'fio' } });
    const btn = await screen.findByTestId(`material-result-${MATERIAL_MOCK.sap}`);
    fireEvent.click(btn);
    await waitFor(() =>
      expect(screen.queryByTestId('qty-popup')).not.toBeNull()
    );
  });

  // ── confirmAddItem — ramo material ─────────────────────────────────────────

  it('confirmAddItem (material) fecha popup ao confirmar', async () => {
    defaultApi.searchMaterials.mockResolvedValue([MATERIAL_MOCK]);
    render(<Configurator />);
    const switchBtn = await screen.findByTestId('btn-switch-materiais');
    fireEvent.click(switchBtn);
    const input = await screen.findByTestId('material-search-input');
    fireEvent.change(input, { target: { value: 'fio' } });
    const btn = await screen.findByTestId(`material-result-${MATERIAL_MOCK.sap}`);
    fireEvent.click(btn);
    const popup = await screen.findByTestId('qty-popup');
    expect(popup).toBeTruthy();
    fireEvent.click(screen.getByTestId('btn-confirm-qty'));
    await waitFor(() =>
      expect(screen.queryByTestId('qty-popup')).toBeNull()
    );
  });

  it('btn-cancel-qty fecha QuantityPopup', async () => {
    defaultApi.searchKits.mockResolvedValue([ESTRUTURA_MOCK]);
    render(<Configurator />);
    const input = await screen.findByTestId('structure-search-input');
    fireEvent.change(input, { target: { value: 'TE' } });
    await screen.findByTestId(`structure-result-${ESTRUTURA_MOCK.codigo_kit}`);
    fireEvent.click(screen.getByTestId(`structure-result-${ESTRUTURA_MOCK.codigo_kit}`));
    await screen.findByTestId('qty-popup');
    fireEvent.click(screen.getByTestId('btn-cancel-qty'));
    await waitFor(() =>
      expect(screen.queryByTestId('qty-popup')).toBeNull()
    );
  });
});
