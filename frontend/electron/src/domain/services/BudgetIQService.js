/**
 * BudgetIQService
 * Domain service for Multi-Criterion Budget Optimization (Phase 11).
 * Calculates TCO (Total Cost of Ownership) using: Price + (Maintenance * Years) + Labor.
 */
class BudgetIQService {
    // Standard labor costs (Cost Modular Reference)
    static LABOR_COSTS = {
        'POSTE': 450.00,
        'TRANSFORMADOR': 1200.00,
        'CABO': 5.50, // per meter
        'KIT': 120.00
    };

    /**
     * Calculates the TCO for a material over its lifespan.
     * @param {Object} material - Material data with price, maintenance and life cycle.
     */
    static calculateTCO(material, horizonYears = 10) {
        const price = material.preco_unitario || 0;
        const maintenanceMeses = material.ciclo_manutencao_meses || 24;
        const vidaUtilAnos = material.vida_util_anos || 30;

        // Ensure horizon doesn't exceed lifespan
        const effectiveHorizon = Math.min(horizonYears, vidaUtilAnos);

        // Maintenance cost estimated as 5% of price per intervention
        const maintenanceCost = price * 0.05;
        const interventions = Math.floor((effectiveHorizon * 12) / maintenanceMeses);

        const totalMaintenance = interventions * maintenanceCost;
        const labor = this.estimateLabor(material);

        return {
            acquisition: price,
            maintenance: totalMaintenance,
            labor: labor,
            total: price + totalMaintenance + labor,
            annualized: (price + totalMaintenance + labor) / effectiveHorizon
        };
    }

    /**
     * Estimates labor cost based on productivity coefficients and difficulty factors.
     */
    static estimateLabor(material, difficultyFactor = 1.0) {
        const desc = (material.descricao || "").toUpperCase();
        let monHours = this.PRODUCTIVITY.KIT;

        if (desc.includes('POSTE')) monHours = this.PRODUCTIVITY.POSTE;
        else if (desc.includes('TRANSFORMADOR')) monHours = this.PRODUCTIVITY.TRANSFORMADOR;
        else if (desc.includes('CABO')) monHours = this.PRODUCTIVITY.CABO * (material.quantidade || 1);

        return monHours * this.HOURLY_RATE * difficultyFactor;
    }

    /**
     * Scores a material choice based on cost-benefit.
     * Higher score = Better long-term investment.
     */
    static scoreMaterial(material) {
        const tco = this.calculateTCO(material);
        // Inverse of annualized cost normalized (simplified)
        return Math.min(100, Math.round(10000 / (tco.annualized || 1)));
    }
}

module.exports = BudgetIQService;
