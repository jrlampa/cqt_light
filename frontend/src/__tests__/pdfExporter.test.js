import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.hoisted ensures variables are available before vi.mock factories run
const { mockDoc } = vi.hoisted(() => {
    const mockDoc = {
        internal: {
            pageSize: { getWidth: () => 210, getHeight: () => 297 },
            getNumberOfPages: () => 1,
        },
        setFillColor: vi.fn(),
        rect: vi.fn(),
        setTextColor: vi.fn(),
        setFontSize: vi.fn(),
        setFont: vi.fn(),
        text: vi.fn(),
        setPage: vi.fn(),
        save: vi.fn(),
        lastAutoTable: { finalY: 80 },
    };
    return { mockDoc };
});

vi.mock('jspdf', () => {
    function MockJsPDF() { return mockDoc; }
    MockJsPDF.prototype = mockDoc;
    return { default: MockJsPDF };
});

vi.mock('jspdf-autotable', () => ({ default: vi.fn() }));

import { gerarRelatorioPDF } from '../utils/pdfExporter';

describe('pdfExporter — gerarRelatorioPDF', () => {
    const materiais = [
        { sap: 'S-001', descricao: 'POSTE CONCRETO 11/300', unidade: 'UN', quantidade: 2, preco_unitario: 1000, subtotal: 2000, categoria: 'POSTES' },
        { sap: 'S-002', descricao: 'CABO CA 50MM', unidade: 'M', quantidade: 100, preco_unitario: 5, subtotal: 500, categoria: 'CABOS' },
    ];
    const custoData = { totalMaterial: 2500, totalServico: 500, totalGeral: 3000 };
    const estruturas = [{ codigo_kit: 'N1', descricao_kit: 'Estrutura N1', quantidade: 1 }];

    beforeEach(() => { vi.clearAllMocks(); });

    it('deve chamar doc.save() para baixar o PDF', () => {
        gerarRelatorioPDF({ materiais, custoData, estruturas });
        expect(mockDoc.save).toHaveBeenCalledOnce();
        expect(mockDoc.save.mock.calls[0][0]).toMatch(/orcamento_cqt_/);
    });

    it('deve funcionar sem empresa ativa (empresa = null)', () => {
        expect(() =>
            gerarRelatorioPDF({ materiais, custoData, estruturas, empresa: null })
        ).not.toThrow();
    });

    it('deve funcionar com lista de materiais vazia', () => {
        expect(() =>
            gerarRelatorioPDF({
                materiais: [],
                custoData: { totalMaterial: 0, totalServico: 0, totalGeral: 0 },
                estruturas: [],
            })
        ).not.toThrow();
    });

    it('deve chamar setFillColor para o cabeçalho azul', () => {
        gerarRelatorioPDF({ materiais, custoData, estruturas });
        expect(mockDoc.setFillColor).toHaveBeenCalledWith(37, 99, 235);
    });
});
