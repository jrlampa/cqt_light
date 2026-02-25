const DemandService = require('../src/domain/services/DemandService');
const EngineeringService = require('../src/infrastructure/services/EngineeringService');

describe('Electrical Intelligence Debug', () => {
    it('debug demand calculation', () => {
        const consumers = [{ type: 'RESIDENCIAL', qty: 50, loadKVA: 2.0 }];
        const result = DemandService.calculateDemand(consumers);
        console.log('DEMAND RESULT:', result);
        expect(result.suggestedTransformerKVA).toBeGreaterThanOrEqual(45);
    });

    it('debug phase balance', () => {
        const consumers = [
            { phase: 'A', loadKVA: 10 },
            { phase: 'B', loadKVA: 5 },
            { phase: 'C', loadKVA: 10 }
        ];
        const suggestion = EngineeringService.suggestConsumerPhase(consumers);
        console.log('BALANCE SUGGESTION:', suggestion);
        expect(suggestion.suggestedPhase).toBe('B');
    });
});
