/**
 * OptimizationService
 * Brain for material substitution and cost-saving suggestions.
 * Integrates with Engineering and Database layers.
 */

const db = require('../db/database.cjs');

class OptimizationService {
    /**
     * Finds cheaper alternatives for the given materials using DB.
     * @param {Array} currentMaterials List of materials in the current BOM
     * @param {string} zone Regional pricing zone
     * @returns {Array} Optimization suggestions
     */
    async findCostSavings(currentMaterials, zone = 'Urbano') {
        const suggestions = [];

        for (const mat of currentMaterials) {
            // 1. Query DB for alternatives
            const alternatives = db.getMaterialAlternatives(mat.sap);

            if (alternatives && alternatives.length > 0) {
                const bestAlt = alternatives[0];
                const currentPrice = db.getRegionalPrice(mat.sap, zone);
                const altPrice = db.getRegionalPrice(bestAlt.alternative_sap, zone);

                if (altPrice < currentPrice) {
                    const savings = ((1 - altPrice / currentPrice) * 100).toFixed(1);
                    suggestions.push({
                        original_sap: mat.sap,
                        original_name: mat.descricao,
                        suggested_sap: bestAlt.alternative_sap,
                        suggested_name: bestAlt.alternative_desc,
                        savings_percent: parseFloat(savings),
                        reason: bestAlt.notes || 'Alternativa técnica equivalente com melhor custo-benefício.'
                    });
                }
            }

            // 2. Volume Discount Heuristics (Fallback)
            if (mat.quantidade >= 10 && mat.descricao.toUpperCase().includes('ISOLADOR')) {
                suggestions.push({
                    original_sap: mat.sap,
                    original_name: mat.descricao,
                    suggested_sap: mat.sap,
                    suggested_name: `${mat.descricao} (LOTE ECONOMICO)`,
                    savings_percent: 5,
                    reason: 'Desconto por volume detectado para este item.'
                });
            }
        }

        return suggestions;
    }

    /**
     * Suggests a "Smart Fix" for an engineering violation.
     * @param {Object} violation Engineering report from EngineeringService
     * @returns {Object} Suggested action (e.g. swap structure, swap pole)
     */
    suggestEngineeringFix(violation) {
        if (violation.status === 'SAFE') return null;

        if (violation.totalLoadDaN > violation.capacityDaN) {
            return {
                action: 'SWAP_POLE',
                target_strength: Math.ceil(violation.totalLoadDaN / 100) * 100 + 300,
                message: `Substituir por poste de ${Math.ceil(violation.totalLoadDaN / 100) * 100 + 300} daN.`
            };
        }

        return null;
    }
}

module.exports = new OptimizationService();
