import predictor from '../services/BimPredictorService';

describe('BimPredictorService', () => {
    it('should predict structural category for poles', () => {
        const result = predictor.predict('POSTE CONCRETO 11/300');
        expect(result.category).toBe('Estrutura / Suporte');
        expect(result.bim_family).toBe('Poles');
        expect(result.confidence).toMatch(/[0-9]+%/);
    });

    it('should predict conductor category', () => {
        const result = predictor.predict('CABO ALUMINIO CAA 1/0');
        expect(result.category).toBe('Condutores / Rede');
        expect(result.bim_family).toBe('Conductors');
    });

    it('should predict transformer category and detect voltage', () => {
        const result = predictor.predict('TRANSFORMADOR 45KVA 13.8KV');
        expect(result.category).toBe('Equipamentos / Transformação');
        expect(result.voltage_level).toBe('MT');
    });

    it('should detect low voltage markers', () => {
        const result = predictor.predict('FIO COBRE BAIXA TENSÃO');
        expect(result.voltage_level).toBe('BT');
    });

    it('should predict protection category', () => {
        const result = predictor.predict('CHAVE FUSIVEL 15KV');
        expect(result.category).toBe('Proteção / Manobra');
    });

    it('should predict insulation category', () => {
        const result = predictor.predict('ISOLADOR PORCELANA');
        expect(result.category).toBe('Isolação');
    });

    it('should predict hardware category', () => {
        const result = predictor.predict('PARAFUSO MAO FRANCESA');
        expect(result.category).toBe('Ferragens / Acessórios');
    });

    it('should return default for unknown descriptions', () => {
        const result = predictor.predict('XYZ UNKNOWN ITEM');
        expect(result.category).toBe('Diversos / Consumo');
        expect(result.confidence).toBe('15%');
    });

    it('should handle null/empty descriptions', () => {
        const result = predictor.predict(null);
        expect(result.category).toBe('Diversos / Consumo');
    });
});
