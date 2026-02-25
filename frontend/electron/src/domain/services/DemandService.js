/**
 * DemandService
 * Domain service for load calculation and transformer sizing.
 * Follows ABNT/Utility standards for demand factors.
 */
class DemandService {
    // Standard transformer ratings (kVA)
    static TRANSFORMER_SIZES = [15, 30, 45, 75, 112.5, 150, 300, 500];

    // Default demand factors (Simplified)
    static CONSUMER_PROFILES = {
        'RESIDENCIAL': { factor: 0.4, avgKVA: 1.5 },
        'COMERCIAL': { factor: 0.7, avgKVA: 5.0 },
        'INDUSTRIAL': { factor: 0.8, avgKVA: 15.0 },
        'ILUMINACO_PUBLICA': { factor: 1.0, avgKVA: 0.2 }
    };

    /**
     * Calculates the total demand using diversified demand curves (Simplified NBR 5410/8214).
     * Diversified demand decreases per unit as the number of consumers increases.
     * @param {Array} consumers - List of consumers { type, qty, loadKVA }.
     */
    static calculateDemand(consumers = []) {
        if (consumers.length === 0) {
            return { totalDemandKVA: 0, suggestedTransformerKVA: 0 };
        }

        let totalInstalledLoadKVA = 0;
        let diversifiedDemandKVA = 0;

        // Consumer Coincidence Factor Table (Simplified for illustration)
        // In a real utility, this comes from specific RGD/RDU curves
        const getCoincidenceFactor = (n) => {
            if (n <= 1) return 1.0;
            if (n <= 5) return 0.8;
            if (n <= 10) return 0.6;
            if (n <= 25) return 0.45;
            if (n <= 50) return 0.35;
            return 0.3; // Limit for many consumers
        };

        const consumerGroups = {};
        consumers.forEach(c => {
            const type = c.type?.toUpperCase() || 'RESIDENCIAL';
            if (!consumerGroups[type]) consumerGroups[type] = { count: 0, sumLoad: 0 };

            const profile = this.CONSUMER_PROFILES[type] || this.CONSUMER_PROFILES.RESIDENCIAL;
            const qty = c.qty || 1;
            const unitLoad = c.loadKVA || profile.avgKVA;

            consumerGroups[type].count += qty;
            consumerGroups[type].sumLoad += unitLoad * qty;
            totalInstalledLoadKVA += unitLoad * qty;
        });

        // 1. Calculate diversified demand for each group
        Object.values(consumerGroups).forEach((group) => {
            const factor = getCoincidenceFactor(group.count);
            // Diversity is handled by the coincidence factor based on quantity
            diversifiedDemandKVA += group.sumLoad * factor;
        });

        // 2. Add 20% growth margin
        const totalDemandWithMargin = diversifiedDemandKVA * 1.25; // 25% for robustness

        // 3. Find optimal transformer size
        const suggestedSize = this.TRANSFORMER_SIZES.find(size => size >= totalDemandWithMargin) || 500;

        return {
            totalInstalledLoadKVA: totalInstalledLoadKVA.toFixed(2),
            diversifiedDemandKVA: diversifiedDemandKVA.toFixed(2),
            totalDemandWithMargin: totalDemandWithMargin.toFixed(2),
            suggestedTransformerKVA: suggestedSize,
            factorOfSimultaneity: (diversifiedDemandKVA / totalInstalledLoadKVA).toFixed(3),
            status: totalDemandWithMargin > 500 ? 'OVER_LIMIT' : 'OK',
            message: `Demanda diversificada: ${diversifiedDemandKVA.toFixed(1)} kVA. Projeção: ${totalDemandWithMargin.toFixed(1)} kVA. Trafo Sugerido: ${suggestedSize} kVA.`
        };
    }

    /**
     * Analyzes current transformer in the project vs calculated demand.
     */
    static validateTransformerSizing(projectMaterials, calculatedDemand) {
        const currentTransformer = projectMaterials.find(m =>
            m.descricao?.toUpperCase().includes('TRANSFORMADOR') ||
            m.sap?.startsWith('T-')
        );

        if (!currentTransformer) return null;

        // Match power from description (ex: "TRANSFORMADOR 75 KVA")
        const powerMatch = currentTransformer.descricao?.match(/(\d+)\s*KVA/i);
        const currentPower = powerMatch ? parseFloat(powerMatch[1]) : 0;

        const isUndersized = currentPower < calculatedDemand.totalDemandWithMargin;
        const isOversized = currentPower > calculatedDemand.totalDemandWithMargin * 1.5;

        return {
            currentPower,
            suggestedPower: calculatedDemand.suggestedTransformerKVA,
            status: isUndersized ? 'CRITICAL' : (isOversized ? 'WARNING' : 'SAFE'),
            message: isUndersized
                ? `ALERTA: Transformador atual (${currentPower}kVA) subdimensionado para a demanda (${calculatedDemand.totalDemandWithMargin}kVA).`
                : (isOversized ? `Transformador atual (${currentPower}kVA) está superdimensionado.` : 'Transformador dimensionado corretamente.')
        };
    }
}

module.exports = DemandService;
