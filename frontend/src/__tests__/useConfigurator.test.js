import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useConfigurator } from '../components/configurator/useConfigurator';
import React from 'react';

// Mock lucide-react
vi.mock('lucide-react', () => {
    return new Proxy({}, {
        get: (target, prop) => {
            if (prop === '__esModule') return true;
            return (props) => React.createElement('div', { 'data-testid': `icon-${prop.toLowerCase()}`, ...props }, prop);
        }
    });
});

// Mock hooks
vi.mock('../hooks/useBudgetCalculator', () => ({
    useBudgetCalculator: () => ({
        custoData: { materiais: [], totalMaterial: 0, totalServico: 0, totalGeral: 0 },
        setCustoData: vi.fn(),
        calculateTotal: vi.fn().mockImplementation(() => Promise.resolve())
    })
}));

vi.mock('../hooks/useKeyboardNav', () => ({
    useKeyboardNav: () => ({
        setPosteHighlight: vi.fn(),
        setStructureHighlight: vi.fn(),
        setMaterialHighlight: vi.fn(),
        focusQty: vi.fn(),
        focusStructure: vi.fn(),
        focusMaterial: vi.fn()
    })
}));

// Mock window.api
global.window.api = {
    getAllMaterials: vi.fn().mockResolvedValue([]),
    searchKits: vi.fn().mockResolvedValue([]),
    getKitComposition: vi.fn().mockResolvedValue([]),
    resolverSufixo: vi.fn().mockResolvedValue([]),
    saveOrcamento: vi.fn().mockResolvedValue(true),
    getAtiva: vi.fn().mockResolvedValue({ id: 1, nome: 'Empresa Teste' }),
    getAllSufixos: vi.fn().mockResolvedValue([]),
    getAllTemplatesManuais: vi.fn().mockResolvedValue([]),
    searchMaterials: vi.fn().mockResolvedValue([]),
    calculateStress: vi.fn().mockResolvedValue({ status: 'SAFE' }),
    auditProject: vi.fn().mockResolvedValue([]),
    calculateSag: vi.fn().mockResolvedValue({}),
    rationalizeBOM: vi.fn().mockResolvedValue({}),
    generateTechnicalMemorial: vi.fn().mockResolvedValue('memorial data')
};

describe('useConfigurator Hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    it('should initialize with default state', async () => {
        let result;
        await act(async () => {
            const hook = renderHook(() => useConfigurator(() => { }));
            result = hook.result;
        });
        expect(result.current.state.estruturas).toEqual([]);
        expect(result.current.state.activeTab).toBe('estruturas');
    });

    it('should handle searchPoste with filtering', async () => {
        window.api.searchMaterials.mockResolvedValue([
            { sap: '1', descricao: 'POSTE DT 300' },
            { sap: '2', descricao: 'CRUZETA' }
        ]);
        let result;
        await act(async () => {
            const hook = renderHook(() => useConfigurator(() => { }));
            result = hook.result;
        });

        await act(async () => {
            await result.current.handlers.searchPoste('POSTE');
        });

        expect(result.current.state.posteResults).toHaveLength(1);
        expect(result.current.state.showPosteDropdown).toBe(true);
    });

    it('should manage structures addition and removal', async () => {
        let result;
        await act(async () => {
            const hook = renderHook(() => useConfigurator(() => { }));
            result = hook.result;
        });

        await act(async () => {
            result.current.handlers.openQtyPopup({ codigo_kit: 'K1' }, 'structure');
        });

        expect(result.current.state.showQtyPopup).toBe(true);

        await act(async () => {
            result.current.handlers.confirmAddItem();
        });

        expect(result.current.state.estruturas).toHaveLength(1);

        const id = result.current.state.estruturas[0].id;
        await act(async () => {
            result.current.handlers.removeStructure(id);
        });
        expect(result.current.state.estruturas).toHaveLength(0);
    });

    it('should run project audit', async () => {
        window.api.auditProject.mockResolvedValue([{ severity: 'INFO', message: 'Audit OK' }]);
        let result;
        await act(async () => {
            const hook = renderHook(() => useConfigurator(() => { }));
            result = hook.result;
        });

        await act(async () => {
            await result.current.handlers.runAudit();
        });

        expect(result.current.state.auditResults).toHaveLength(1);
        expect(result.current.state.showAuditReport).toBe(true);
    });
});
