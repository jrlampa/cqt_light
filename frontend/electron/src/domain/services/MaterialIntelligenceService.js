const MaterialRepository = require('../../infrastructure/repositories/MaterialRepository');

/**
 * MaterialIntelligenceService
 * Handles semantic matching of informal names to SAP codes.
 */
class MaterialIntelligenceService {
    /**
     * Normalizes technical terms to a standard format.
     */
    static normalize(text) {
        if (!text) return '';
        return text.toUpperCase()
            .replace(/PT/g, 'POSTE')
            .replace(/DT/g, 'DUPLO T')
            .replace(/SC/g, 'SECAO CIRCULAR')
            .replace(/(\d+)M/g, '$1 METROS')
            .replace(/(\d+)\/(\d+)/g, '$1 $2')
            .replace(/[.\-/]/g, ' ')
            .trim();
    }

    /**
     * Jaro-Winkler Similarity algorithm for technical string matching.
     */
    static getSimilarity(s1, s2) {
        if (s1 === s2) return 1.0;
        const len1 = s1.length;
        const len2 = s2.length;
        const matchWindow = Math.floor(Math.max(len1, len2) / 2) - 1;
        const matches1 = new Array(len1).fill(false);
        const matches2 = new Array(len2).fill(false);

        let matches = 0;
        for (let i = 0; i < len1; i++) {
            const start = Math.max(0, i - matchWindow);
            const end = Math.min(i + matchWindow + 1, len2);
            for (let j = start; j < end; j++) {
                if (!matches2[j] && s1[i] === s2[j]) {
                    matches1[i] = true;
                    matches2[j] = true;
                    matches++;
                    break;
                }
            }
        }

        if (matches === 0) return 0.0;

        let transpositions = 0;
        let k = 0;
        for (let i = 0; i < len1; i++) {
            if (matches1[i]) {
                while (!matches2[k]) k++;
                if (s1[i] !== s2[k]) transpositions++;
                k++;
            }
        }

        const jaro = (matches / len1 + matches / len2 + (matches - transpositions / 2) / matches) / 3;

        // Winkler adjustment
        const prefixLimit = 4;
        let p = 0;
        for (let i = 0; i < Math.min(len1, len2, prefixLimit); i++) {
            if (s1[i] === s2[i]) p++;
            else break;
        }

        return jaro + p * 0.1 * (1 - jaro);
    }

    /**
     * Matches an informal query against the material database.
     */
    static async matchMaterial(query) {
        const normQuery = this.normalize(query);
        const queryTokens = normQuery.split(/\s+/).filter(t => t.length > 1);

        // 1. Fetch search candidates (using first word as anchor for DB performance)
        const candidates = await MaterialRepository.search(queryTokens[0] || query);

        // 2. Rank candidates
        const results = candidates.map(m => {
            const normDesc = this.normalize(m.descricao);
            let score = this.getSimilarity(normQuery, normDesc);

            // Boost score based on token overlaps
            const descTokens = normDesc.split(/\s+/);
            const overlap = queryTokens.filter(t => descTokens.includes(t)).length;
            score += (overlap / queryTokens.length) * 0.5;

            return {
                ...m,
                score: Math.min(1.0, score),
                matchConfidence: score > 0.8 ? 'HIGH' : score > 0.6 ? 'MEDIUM' : 'LOW'
            };
        });

        return results
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);
    }
}

module.exports = MaterialIntelligenceService;
