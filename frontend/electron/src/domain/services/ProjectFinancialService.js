const BudgetIQService = require('./BudgetIQService');

/**
 * ProjectFinancialService
 * Orchestrates the full project budget (Material + Labor).
 * Implements "Project Health" metrics and advanced financial analysis.
 */
class ProjectFinancialService {
    /**
     * Calculates the full executive budget summary.
     * @param {Array} materials - List of materials in the BOM.
     * @param {Object} projectData - Full project context for demand analysis.
     */
    static calculateExecutiveSummary(materials, projectData) {
        const matTotal = materials.reduce((sum, m) => sum + (m.preco || 0) * (m.quantidade || 1), 0);

        // Labor calculation using BudgetIQService enhanced logic
        const laborTotal = materials.reduce((sum, m) => {
            return sum + BudgetIQService.estimateLabor(m);
        }, 0);

        const totalCAPEX = matTotal + laborTotal;

        // Project Health: Cost per kVA Installed
        const totalKVA = (projectData.poles || [])
            .reduce((sum, p) => sum + (p.trafo_kva || 0), 0);

        const costPerKVA = totalKVA > 0 ? (totalCAPEX / totalKVA) : 0;

        // ROI Potential (Value Engineering Savings)
        const potentialSavings = materials
            .filter(m => m.fromOptimization)
            .reduce((sum, m) => sum + (m.savingsAmount || 0), 0);

        return {
            matTotal,
            laborTotal,
            totalCAPEX,
            costPerKVA,
            healthStatus: this.getHealthStatus(costPerKVA),
            potentialSavings,
            roiIQ: potentialSavings > 0 ? (potentialSavings / totalCAPEX) * 100 : 0
        };
    }

    /**
     * Determines project financial health based on industry benchmarks.
     * Benchmark: Below R$ 1.200/kVA is EXCELLENT for urban distribution.
     */
    static getHealthStatus(costPerKVA) {
        if (costPerKVA === 0) return 'NEUTRAL';
        if (costPerKVA < 1200) return 'EXCELLENT';
        if (costPerKVA < 2500) return 'GOOD';
        if (costPerKVA < 4500) return 'REGULAR';
        return 'CRITICAL';
    }
}

module.exports = ProjectFinancialService;
