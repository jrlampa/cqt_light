import { vi, expect } from 'vitest';
import React from 'react';

// Global Lucide Mock
vi.mock('lucide-react', () => {
    return new Proxy({}, {
        get: (target, prop) => {
            if (prop === '__esModule') return true;
            const Icon = (props) => {
                // Return simple div if React is available, otherwise just a string for Node tests
                if (typeof React !== 'undefined' && React.createElement) {
                    return React.createElement('div', {
                        'data-testid': `icon-${prop.toLowerCase()}`,
                        ...props
                    }, prop);
                }
                return prop;
            };
            Icon.displayName = prop;
            return Icon;
        }
    });
});

// Environment-specific setup
if (typeof window !== 'undefined') {
    // Add Jest DOM matchers only in browser environment
    import('@testing-library/jest-dom').then((matchers) => {
        if (matchers.default) {
            // expect.extend(matchers.default); // Handle if needed, but vitest usually picks it up if imported
        }
    }).catch(() => { });

    global.window.api = {
        getStats: vi.fn().mockResolvedValue({ materials: 0, kits: 0, servicos: 0 }),
        getGovernanceStats: vi.fn().mockResolvedValue({ total: 0, open: 0, resolved: 0 }),
        getConfig: vi.fn().mockResolvedValue(null),
        auditProject: vi.fn().mockResolvedValue([]),
        generateBOM: vi.fn(),
        getAllMaterials: vi.fn().mockResolvedValue([]),
        searchKits: vi.fn().mockResolvedValue([]),
        getAtiva: vi.fn().mockResolvedValue({ id: 1, nome: 'Empresa Teste' }),
        getAllSufixos: vi.fn().mockResolvedValue([]),
        getAllTemplatesManuais: vi.fn().mockResolvedValue([]),
        searchMaterials: vi.fn().mockResolvedValue([]),
        calculateStress: vi.fn().mockResolvedValue({ status: 'SAFE' }),
        getKitComposition: vi.fn().mockResolvedValue([]),
    };
}

// Global Electron Mock - Critical for IpcController and Services
vi.mock('electron', () => ({
    ipcMain: {
        handle: vi.fn(),
    },
    dialog: {
        showSaveDialog: vi.fn(),
    },
    app: {
        getPath: vi.fn().mockReturnValue('mock/path'),
        isPackaged: false
    }
}));
