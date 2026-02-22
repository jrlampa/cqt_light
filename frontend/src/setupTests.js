import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Electron window.api
global.window.api = {
    auditProject: vi.fn(),
    generateBOM: vi.fn(),
    getAllMaterials: vi.fn(),
    searchKits: vi.fn(),
    // Add other API methods as needed
};
