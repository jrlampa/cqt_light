const EngineeringService = require('../../infrastructure/services/EngineeringService');

/**
 * ValueEngineeringService
 * Domain service focused on optimizing technical choices based on actual physics vs material limits.
 */
class ValueEngineeringService {
    /**
     * Analyzes mechanical assets for possible downgrades if safety factors are excessive.
     * @param {Array} poles - List of poles in the project.
     * @param {Array} materials - Current BOM.
     * @param {Object} projectData - Full project context.
     */
    static analyzeMechanicalOptimizations(poles, materials, projectData) {
        const suggestions = [];

        poles.forEach((p, idx) => {
            // Find the material associated with this pole index
            const poleMaterial = materials.find(m => m.sap === p.sap || (m.descricao?.toUpperCase().includes('POSTE') && m.poleIndex === idx));
            if (!poleMaterial) return;

            const stress = EngineeringService.calculateMechanicalStress(
                { altura_m: p.altura_m, esforco_nom_dan: p.esforco_nom_dan },
                poles.filter((_, i) => i === idx),
                projectData
            );

            // Logic: If utilization < 35% and the pole is >= 300daN, suggest a cheaper one
            if (stress.utilizationPercent < 35 && p.esforco_nom_dan > 150) {
                const cheaperSap = p.esforco_nom_dan > 300 ? 'PT-11-300' : 'PT-11-150';
                suggestions.push({
                    type: 'ENGENHARIA_VALOR',
                    level: 'INFO',
                    target: `Poste ${idx + 1}`,
                    message: `Superdimensionamento: Utilização de ${stress.utilizationPercent}%.`,
                    impact: `Redução sugerida para ${cheaperSap}.`,
                    suggestedSap: cheaperSap,
                    originalSap: p.sap,
                    data: {
                        currentLoad: stress.totalLoadDaN,
                        limitDaN: p.esforco_nom_dan,
                        utilization: stress.utilizationPercent
                    }
                });
            }
        });

        return suggestions;
    }

    /**
     * Calculates the ROI (Return on Investment) for all suggested optimizations.
     */
    static calculateTotalPotentialROI(optimizations) {
        // This will be implemented when we have a global cost view
        return optimizations.length * 150; // Mocked placeholder logic for now
    }
}

module.exports = ValueEngineeringService;
