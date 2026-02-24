import { describe, it, expect, vi } from 'vitest';

// Fix relative path for CommonJS interception
// target: ../src/application/AuditProjectUseCase.js
// required from test: ../src/application/AuditProjectUseCase.js or absolute-like

vi.mock('../src/infrastructure/services/PythonAuditService', () => ({
    audit: vi.fn(() => Promise.resolve([{ severity: 'INFO', message: 'Logic Audit OK' }]))
}));

vi.mock('../src/infrastructure/services/CADAutomationService', () => ({
    auditDXFQuality: vi.fn(() => Promise.resolve([{ severity: 'SUCCESS', message: 'CAD Audit OK' }]))
}));

vi.mock('../src/infrastructure/services/SanitizationService', () => ({
    sanitizeProjectData: vi.fn(data => data)
}));

// USE RELATIVE PATH MATCHING DIRECTORY STRUCTURE
const AuditProjectUseCase = require('../src/application/AuditProjectUseCase');

describe('AuditProjectUseCase (100% Coverage)', () => {
    it('should coordinate logic and cad audits', async () => {
        const result = await AuditProjectUseCase.execute({ name: 'Test' });
        expect(result).toHaveLength(2);
        expect(result[0].message).toBe('Logic Audit OK');
    });

    it('should handle errors gracefully', async () => {
        const PythonAuditService = require('../src/infrastructure/services/PythonAuditService');
        PythonAuditService.audit.mockImplementationOnce(() => { throw new Error('Simulated Failure'); });
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        await expect(AuditProjectUseCase.execute({})).rejects.toThrow();
        consoleSpy.mockRestore();
    });
});
