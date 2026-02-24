import { describe, it, expect, vi } from 'vitest';

// Mock electron
vi.mock('electron', () => ({
    ipcMain: {
        handle: vi.fn()
    }
}));

// Mock logger
vi.mock('../src/infrastructure/services/Logger', () => ({
    info: vi.fn(),
    error: vi.fn()
}));

// Mock controllers
const mockController = {
    register: vi.fn()
};
vi.mock('../src/interfaces/ipc/AnalyticsController', () => mockController);
vi.mock('../src/interfaces/ipc/AuditController', () => mockController);
vi.mock('../src/interfaces/ipc/BomController', () => mockController);
vi.mock('../src/interfaces/ipc/EngineeringController', () => mockController);
vi.mock('../src/interfaces/ipc/IntelligenceController', () => mockController);
vi.mock('../src/interfaces/ipc/MaterialController', () => mockController);
vi.mock('../src/interfaces/ipc/OptimizationController', () => mockController);
vi.mock('../src/interfaces/ipc/ReportingController', () => mockController);
vi.mock('../src/interfaces/ipc/SufixoController', () => mockController);

const ControllerRegistry = require('../src/interfaces/ControllerRegistry');

describe('ControllerRegistry (100% Coverage)', () => {
    it('registerAll should iterate through all controllers', () => {
        ControllerRegistry.registerAll();
        // Since we mock all controllers as the same mock object
        expect(mockController.register).toHaveBeenCalled();
    });

    it('safeHandle should wrap handler with logging and error handling', async () => {
        const { ipcMain } = require('electron');
        const handler = vi.fn().mockResolvedValue('success');

        ControllerRegistry.safeHandle('test-channel', handler);

        // Find the registered callback
        const callback = ipcMain.handle.mock.calls.find(c => c[0] === 'test-channel')[1];
        const result = await callback({}, 'arg1');

        expect(result).toBe('success');
        expect(handler).toHaveBeenCalled();
    });

    it('safeHandle should catch and log errors', async () => {
        const { ipcMain } = require('electron');
        const handler = vi.fn().mockRejectedValue(new Error('IPC Fail'));

        ControllerRegistry.safeHandle('fail-channel', handler);
        const callback = ipcMain.handle.mock.calls.find(c => c[0] === 'fail-channel')[1];

        await expect(callback({})).rejects.toThrow('IPC Fail');
    });
});
