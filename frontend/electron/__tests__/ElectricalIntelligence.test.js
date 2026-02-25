const DemandService = require('../src/domain/services/DemandService');
const EngineeringService = require('../src/infrastructure/services/EngineeringService');

describe('Electrical Intelligence Services', () => {
    describe('DemandService', () => {
        it('should calculate diversified demand lower than installed load for multiple consumers', () => {
            const consumers = [
                { type: 'RESIDENCIAL', qty: 20, loadKVA: 1.5 }, // 30kVA installed
            ];
            const result = DemandService.calculateDemand(consumers);

            expect(parseFloat(result.totalInstalledLoadKVA)).toBe(30);
            expect(parseFloat(result.diversifiedDemandKVA)).toBeLessThan(30);
            expect(result.suggestedTransformerKVA).toBeGreaterThan(0);
        });

        it('should suggest 75kVA transformer for high demand', () => {
            const consumers = [
                { type: 'RESIDENCIAL', qty: 50, loadKVA: 2.0 },
            ];
            const result = DemandService.calculateDemand(consumers);
            expect(result.suggestedTransformerKVA).toBeGreaterThanOrEqual(45);
        });
    });

    describe('EngineeringService - Load Balancing', () => {
        it('should suggest the phase with minimum load', () => {
            const consumers = [
                { phase: 'A', loadKVA: 10 },
                { phase: 'B', loadKVA: 5 },
                { phase: 'C', loadKVA: 10 }
            ];
            const suggestion = EngineeringService.suggestConsumerPhase(consumers);
            expect(suggestion.suggestedPhase).toBe('B');
            expect(suggestion.status).toBe('CRITICAL');
        });

        it('should detect critical unbalance', () => {
            const consumers = [
                { phase: 'A', loadKVA: 50 },
                { phase: 'B', loadKVA: 5 },
                { phase: 'C', loadKVA: 5 }
            ];
            const suggestion = EngineeringService.suggestConsumerPhase(consumers);
            expect(suggestion.status).toBe('CRITICAL');
            expect(suggestion.unbalancePercent).toBeGreaterThan(20);
        });

        it('should calculate neutral current (KVA) correctly', () => {
            const consumers = [
                { phase: 'A', loadKVA: 10 }
            ];
            const suggestion = EngineeringService.suggestConsumerPhase(consumers);
            expect(suggestion.neutralKVA).toBe(10);
        });
    });
});
