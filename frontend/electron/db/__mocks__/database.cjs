// Vitest globals are enabled, so we use 'vi' directly without require
module.exports = {
    getMaterialAlternatives: vi.fn(() => []),
    getRegionalPrice: vi.fn(() => 0),
    all: vi.fn(() => []),
    get: vi.fn(() => ({})),
    run: vi.fn(() => ({ changes: 0 })),
    init: vi.fn(() => Promise.resolve())
};
