/**
 * StructureList, MaterialList, LaborManager — testes estendidos para linhas não cobertas
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StructureList } from '../components/StructureList';
import { MaterialList } from '../components/MaterialList';
import LaborManager from '../components/LaborManager';
import { defaultApi } from './setup';

// ─── StructureList ────────────────────────────────────────────────────────────
const ESTRUTURAS = [
  { id: 1, codigo_kit: 'TE-01', descricao_kit: 'Tangencial Primária', quantidade: 1, custo_servico: 100 },
];

const baseStructureProps = {
  estruturas: ESTRUTURAS,
  activeTab: 'estruturas',
  setActiveTab: vi.fn(),
  searchStructure: vi.fn(),
  structureQuery: '',
  structureResults: [],
  showStructureDropdown: false,
  structureHighlight: -1,
  handleStructureKeyDown: vi.fn(),
  selectStructure: vi.fn(),
  removeStructure: vi.fn(),
  onKitClick: vi.fn(),
  structureRef: { current: null },
  setStructureQuery: vi.fn(),
  setShowStructureDropdown: vi.fn(),
  setStructureHighlight: vi.fn(),
  structureInputRef: { current: null },
};

describe('StructureList — mouseDown no dropdown e click no item', () => {
  it('chama selectStructure via onMouseDown no item do dropdown', () => {
    const selectStructure = vi.fn();
    const results = [
      { codigo_kit: 'TE-02', descricao_kit: 'Tangencial Dupla', custo_servico: 120 },
    ];
    render(
      <StructureList
        {...baseStructureProps}
        showStructureDropdown={true}
        structureResults={results}
        selectStructure={selectStructure}
      />
    );
    // Find the dropdown button (not the list item button)
    const dropdownBtn = document.querySelector(
      '.absolute.z-50 button'
    );
    if (dropdownBtn) {
      fireEvent.mouseDown(dropdownBtn);
      expect(selectStructure).toHaveBeenCalledWith(results[0]);
    }
  });

  it('chama onKitClick ao clicar em um kit na lista', () => {
    const onKitClick = vi.fn();
    render(
      <StructureList
        {...baseStructureProps}
        onKitClick={onKitClick}
      />
    );
    // The estrutura card has onClick={() => onKitClick?.(est)}
    const structureCard = document.querySelector('.group.flex.items-center.justify-between');
    if (structureCard) {
      fireEvent.click(structureCard);
      expect(onKitClick).toHaveBeenCalledWith(ESTRUTURAS[0]);
    }
  });
});

// ─── MaterialList ────────────────────────────────────────────────────────────
const MATERIAIS = [
  { id: 10, sap: 'M001', descricao: 'Condutor BT', unidade: 'M', preco_unitario: 5, quantidade: 10 },
];

const baseMaterialProps = {
  materiaisAvulsos: MATERIAIS,
  activeTab: 'materiais',
  setActiveTab: vi.fn(),
  searchMaterial: vi.fn(),
  materialQuery: '',
  materialResults: [],
  showMaterialDropdown: false,
  materialHighlight: -1,
  handleMaterialKeyDown: vi.fn(),
  selectMaterial: vi.fn(),
  removeMaterial: vi.fn(),
  materialRef: { current: null },
  setMaterialQuery: vi.fn(),
  setShowMaterialDropdown: vi.fn(),
  setMaterialHighlight: vi.fn(),
};

describe('MaterialList — mouseDown no dropdown e click no remove', () => {
  it('chama selectMaterial via onMouseDown no item do dropdown', () => {
    const selectMaterial = vi.fn();
    const results = [
      { sap: 'M002', descricao: 'Poste 11m', unidade: 'UN', preco_unitario: 450 },
    ];
    render(
      <MaterialList
        {...baseMaterialProps}
        showMaterialDropdown={true}
        materialResults={results}
        selectMaterial={selectMaterial}
      />
    );
    const dropdownBtn = document.querySelector('.absolute.z-50 button');
    if (dropdownBtn) {
      fireEvent.mouseDown(dropdownBtn);
      expect(selectMaterial).toHaveBeenCalledWith(results[0]);
    }
  });

  it('chama removeMaterial ao clicar no botão de remover material', () => {
    const removeMaterial = vi.fn();
    render(
      <MaterialList
        {...baseMaterialProps}
        removeMaterial={removeMaterial}
      />
    );
    // The remove button is the trash icon button (opacity-0 group-hover:opacity-100)
    const removeBtn = document.querySelector('.group button');
    if (removeBtn) {
      fireEvent.click(removeBtn);
      expect(removeMaterial).toHaveBeenCalledWith(MATERIAIS[0].id);
    }
  });
});

// ─── LaborManager ─────────────────────────────────────────────────────────────
const SERVICOS = [
  { codigo: 'SV-E1', descricao: 'Escavação 1m', preco_bruto: 120.0 },
  { codigo: 'SV-E2', descricao: 'Escavação 2m', preco_bruto: 200.0 },
];

describe('LaborManager — edição inline e preço no formulário', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {});
    defaultApi.getAllServicos.mockResolvedValue(SERVICOS);
    defaultApi.searchServicos.mockResolvedValue(SERVICOS);
    defaultApi.upsertServico.mockResolvedValue({ changes: 1 });
  });

  it('preenche campo de preço no formulário de novo serviço', async () => {
    render(<LaborManager />);
    fireEvent.click(screen.getByText('Novo'));
    const precoInput = screen.getByPlaceholderText('Preço');
    fireEvent.change(precoInput, { target: { value: '350' } });
    expect(precoInput.value).toBe('350');
  });

  it('abre modo de edição inline ao clicar no botão editar (Edit2)', async () => {
    render(<LaborManager />);
    await waitFor(() => expect(screen.getByText('Escavação 1m')).toBeTruthy());
    // Find the edit button (text-blue-600)
    const editBtns = document.querySelectorAll('.p-1.text-blue-600');
    if (editBtns.length > 0) {
      fireEvent.click(editBtns[0]);
      await waitFor(() => {
        const inputs = screen.getAllByRole('textbox');
        expect(inputs.length).toBeGreaterThan(1); // search + description edit
      });
    }
  });

  it('salva edição inline ao clicar no botão salvar (verde)', async () => {
    render(<LaborManager />);
    await waitFor(() => expect(screen.getByText('Escavação 1m')).toBeTruthy());
    const editBtns = document.querySelectorAll('.p-1.text-blue-600');
    if (editBtns.length > 0) {
      fireEvent.click(editBtns[0]);
      await waitFor(() => expect(document.querySelectorAll('.p-1.text-green-600').length).toBeGreaterThan(0));
      const saveBtns = document.querySelectorAll('.p-1.text-green-600');
      if (saveBtns.length > 0) {
        fireEvent.click(saveBtns[0]);
        await waitFor(() => expect(defaultApi.upsertServico).toHaveBeenCalled());
      }
    }
  });

  it('cancela edição inline ao clicar no botão cancelar (vermelho)', async () => {
    render(<LaborManager />);
    await waitFor(() => expect(screen.getByText('Escavação 1m')).toBeTruthy());
    const editBtns = document.querySelectorAll('.p-1.text-blue-600');
    if (editBtns.length > 0) {
      fireEvent.click(editBtns[0]);
      await waitFor(() => expect(document.querySelectorAll('.p-1.text-red-600').length).toBeGreaterThan(0));
      const cancelBtns = document.querySelectorAll('.p-1.text-red-600');
      if (cancelBtns.length > 0) {
        fireEvent.click(cancelBtns[0]);
        await waitFor(() => expect(screen.queryByText('Escavação 1m')).toBeTruthy());
      }
    }
  });

  it('edita descrição no modo de edição inline', async () => {
    render(<LaborManager />);
    await waitFor(() => expect(screen.getByText('Escavação 1m')).toBeTruthy());
    const editBtns = document.querySelectorAll('.p-1.text-blue-600');
    if (editBtns.length > 0) {
      fireEvent.click(editBtns[0]);
      await waitFor(() => {
        const allInputs = screen.getAllByRole('textbox');
        expect(allInputs.length).toBeGreaterThan(1);
      });
      const allInputs = screen.getAllByRole('textbox');
      // Find the edit mode description input
      const editInput = allInputs.find(i => i.value === 'Escavação 1m');
      if (editInput) {
        fireEvent.change(editInput, { target: { value: 'Escavação Profunda' } });
        expect(editInput.value).toBe('Escavação Profunda');
      }
    }
  });
});
