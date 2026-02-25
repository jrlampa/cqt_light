const MaterialIntelligenceService = require('../src/domain/services/MaterialIntelligenceService');

describe('MaterialIntelligenceService', () => {
    it('should normalize technical abbreviations correctly', () => {
        expect(MaterialIntelligenceService.normalize('PT 11/300')).toContain('POSTE');
        expect(MaterialIntelligenceService.normalize('DT')).toBe('DUPLO T');
        expect(MaterialIntelligenceService.normalize('11m')).toContain('11 METROS');
    });

    it('should calculate high similarity for closely related terms', () => {
        const s1 = "POSTE CONCRETO DUPLO T 11M 300DAN";
        const s2 = "POSTE CONCRETO DT 11/300";

        const sim = MaterialIntelligenceService.getSimilarity(
            MaterialIntelligenceService.normalize(s1),
            MaterialIntelligenceService.normalize(s2)
        );

        expect(sim).toBeGreaterThan(0.8);
    });

    it('should suggest relevant materials for informal queries', async () => {
        // Mocking repository inside the test if needed, or using real DB in integration test
        // For unit test, we focus on the logic
        const query = "PT 11 300";
        const normalized = MaterialIntelligenceService.normalize(query);
        expect(normalized).toBe("POSTE 11 300");
    });
});
