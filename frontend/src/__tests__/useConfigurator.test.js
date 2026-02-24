import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useConfigurator } from '../components/configurator/useConfigurator';
import React from 'react';

// Mock lucide-react (since setupTests is not global anymore)
vi.mock('lucide-react', () => {
    return new Proxy({}, {
        get: (target, prop) => {
            if (prop === '__esModule') return true;
            return (props) => React.createElement('div', { 'data-testid': `icon-${prop.toLowerCase()}`, ...props }, prop);
        }
    });
});

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
};

// Mock window.confirm
if (typeof window.confirm === 'undefined') {
    window.confirm = () => true;
}

describe('useConfigurator Hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.restoreAllMocks();
        localStorage.clear();
    });

    it('should initialize with default state', async () => {
        const { result } = renderHook(() => useConfigurator(() => { }));
        expect(result.current.state.estruturas).toEqual([]);
        expect(result.current.state.isAuditing).toBe(false);
    });

    it('should add a structure via search', async () => {
        window.api.searchKits.mockResolvedValue([{ codigo_kit: 'K1', descricao_kit: 'D1' }]);
        const { result } = renderHook(() => useConfigurator(() => { }));

        await act(async () => {
            await result.current.handlers.searchStructure('K1');
        });

        expect(result.current.state.structureResults.length).toBe(1);
    });

    it('should clear all state', async () => {
        vi.spyOn(window, 'confirm').mockReturnValue(true);
        const { result } = renderHook(() => useConfigurator(() => { }));

        await act(async () => {
            result.current.handlers.clearAll();
        });

        expect(result.current.state.estruturas).toEqual([]);
    });

    it('should update company info', async () => {
        const { result } = renderHook(() => useConfigurator(() => { }));
        await act(async () => {
            result.current.state.setEmpresaAtiva({ id: 1, nome: 'Test' });
        });
        expect(result.current.state.empresaAtiva.id).toBe(1);
    });
});
