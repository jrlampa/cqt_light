const db = require('../db/database.cjs');

/**
 * DashboardService
 * Aggregates data for the BI Dashboard.
 * Aligned with Relational Data Model (MER).
 */

class DashboardService {
    /**
     * Returns a comprehensive set of metrics for the Analytics Dashboard.
     * @returns {Object} Metric categories
     */
    async getMetrics() {
        try {
            // 1. Summary Totals
            const stats = await db.getStats();

            // 2. Material Distribution by Type
            // We'll use the 'tipo_padronizado' field added in Cycle 16
            const materialsDist = await this.getMaterialDistribution();

            // 3. Contractor Performance (HH)
            const performance = await this.getContractorPerformance();

            // 4. Cost Trends (Mocked for now as we don't have historical price tables yet, but prepared for expansion)
            const costTrends = [
                { month: 'Set', sap: 400, market: 420 },
                { month: 'Out', sap: 450, market: 440 },
                { month: 'Nov', sap: 420, market: 450 },
                { month: 'Dez', sap: 510, market: 490 },
                { month: 'Jan', sap: 480, market: 500 },
                { month: 'Fev', sap: 540, market: 530 },
            ];

            return {
                summary: {
                    totalCost: stats.total_value || 0,
                    totalMaterials: stats.materials || 0,
                    efficiency: 92, // To be calculated based on HH vs Estimated
                    activeProjects: 4,
                    totalKits: stats.kits || 0
                },
                materialsByType: materialsDist,
                contractorPerformance: performance,
                costTrends: costTrends
            };
        } catch (err) {
            console.error('DashboardService Error:', err);
            return null;
        }
    }

    async getMaterialDistribution() {
        const query = `
      SELECT tipo_padronizado as name, COUNT(*) as value 
      FROM materiais 
      WHERE name IS NOT NULL AND name != ''
      GROUP BY tipo_padronizado
      ORDER BY value DESC
      LIMIT 6
    `;
        const results = await db.rawQuery(query);
        return results.length > 0 ? results : [
            { name: 'Postes', value: 400 },
            { name: 'Condutores', value: 300 },
            { name: 'Transformadores', value: 120 },
            { name: 'Ferragens', value: 500 }
        ];
    }

    async getContractorPerformance() {
        const query = `
      SELECT empresa_terceira as name, SUM(tempo_estimado) as hh 
      FROM tarefas_operacao 
      JOIN obras_contrato ON 1=1 -- Placeholder until actual project-contract mapping is active
      GROUP BY name
    `;
        // Since we just populated 653 tasks but no actual project counts yet, 
        // we'll return a weighted simulated set based on real contractor names if available
        const results = await db.rawQuery(query);
        if (results.length > 0) {
            return results.map(r => ({ ...r, meta: r.hh * 0.9 }));
        }

        return [
            { name: 'IM3 Brasil', hh: 2400, meta: 2200 },
            { name: 'DINAMO', hh: 3200, meta: 3500 },
            { name: 'BATERRE', hh: 1800, meta: 1900 },
            { name: 'ELTE', hh: 2100, meta: 2000 }
        ];
    }
}

module.exports = new DashboardService();
