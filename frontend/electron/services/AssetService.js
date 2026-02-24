/**
 * AssetService
 * Manages infrastructure asset lifecycle (Poles, Transformers).
 * Logic for predictive maintenance and historical decay.
 */

class AssetService {
    /**
     * Calculates health score for a specific asset.
     * @param {Object} asset { installDate, lastInspection, conditionRatio }
     * @returns {Object} Health report
     */
    calculateAssetHealth(asset) {
        if (!asset || !asset.installDate) return { score: 100, status: 'NEW', risk: 'LOW' };

        const installDate = new Date(asset.installDate);
        const now = new Date();
        const ageYears = (now - installDate) / (1000 * 60 * 60 * 24 * 365);

        // Lifecycle: 25 years for Concrete Poles, 15 for Transformers (typical)
        const lifecycle = asset.type === 'Transformer' ? 15 : 25;
        const ageRatio = Math.min(ageYears / lifecycle, 1);

        // Base health starts at 100%
        let score = 100 * (1 - ageRatio);

        // Condition Penalty (if inspected)
        if (asset.conditionRatio) {
            score *= asset.conditionRatio; // 1.0 (Good) to 0.0 (Failed)
        }

        return {
            ageYears: parseFloat(ageYears.toFixed(1)),
            residualLife: parseFloat((lifecycle - ageYears).toFixed(1)),
            healthScore: Math.round(score),
            status: score < 30 ? 'CRITICAL' : score < 70 ? 'WARNING' : 'GOOD',
            risk: score < 30 ? 'HIGH' : score < 60 ? 'MEDIUM' : 'LOW',
            recommendation: score < 30 ? 'REPOSIÇÃO IMEDIATA' : score < 70 ? 'PROGRAMAR VISTORIA' : 'MANUTENÇÃO PREVENTIVA'
        };
    }

    /**
     * Aggregates project-wide asset risk.
     */
    assessProjectRisk(assets) {
        if (!assets || assets.length === 0) return { overallRisk: 'LOW', criticalCount: 0 };

        const reports = assets.map(a => this.calculateAssetHealth(a));
        const critical = reports.filter(r => r.status === 'CRITICAL');
        const avgScore = reports.reduce((s, r) => s + r.healthScore, 0) / reports.length;

        return {
            averageScore: Math.round(avgScore),
            criticalCount: critical.length,
            overallRisk: avgScore < 50 ? 'HIGH' : avgScore < 80 ? 'MEDIUM' : 'LOW',
            reports
        };
    }
}

module.exports = new AssetService();
