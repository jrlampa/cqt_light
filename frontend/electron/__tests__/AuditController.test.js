import { describe, it, expect, vi } from 'vitest';

// Mock AuditUseCase
vi.mock('../../application/AuditProjectUseCase', () => ({
    execute: vi.fn((data) => ({ score: 100, issues: [] }))
}));

const AuditController = require('../ipc/AuditController');

describe('AuditController', () => {
    it('should register and handle audit-project channel', async () => {
        const handle = vi.fn();
        AuditController.register(handle);

        expect(handle).toHaveBeenCalledWith('audit-project', expect.any(Function));

        const handler = handle.mock.calls[0][1];
        const result = await handler({}, { name: 'Test' });

        expect(result.score).toBe(100);
    });
});
