/**
 * MaintenanceService
 * Engineering engine for priority-based maintenance planning.
 * Reconciles Digital Twin health with field audit history.
 */

const db = require('../db/database.cjs');
const BimPredictorService = require('./BimPredictorService');

class MaintenanceService {
    /**
     * Recommends maintenance priorities for all mapped assets.
     */
    async generateSuggestedBacklog() {
        const assets = await db.getAllGisAssets();
        const suggestions = [];

        for (const asset of assets) {
            const material = { descricao: asset.material_desc, vida_util_anos: asset.material_vida_util };
            const lifecycle = BimPredictorService.estimateLifecycle(asset, material);
            const inspections = await db.getVistoriasByPole(asset.pole_id);

            // Reconciled Health Logic: Field findings overwrite theoretical decay
            let reconciledHealth = lifecycle.health;
            if (inspections.length > 0) {
                const latest = inspections[0];
                if (latest.condicao_encontrada === 'critico') reconciledHealth = Math.min(reconciledHealth, 20);
                if (latest.condicao_encontrada === 'precário') reconciledHealth = Math.min(reconciledHealth, 40);
                if (latest.condicao_encontrada === 'bom') reconciledHealth = Math.max(reconciledHealth, 80);
            }

            if (reconciledHealth < 50) {
                suggestions.push({
                    pole_id: asset.pole_id,
                    predicted_health: lifecycle.health,
                    reconciled_health: reconciledHealth,
                    priority: reconciledHealth < 25 ? 'alta' : 'media',
                    reason: reconciledHealth < 25 ? 'Vulnerabilidade Crítica' : 'Degradação Acentuada',
                    suggested_action: reconciledHealth < 30 ? 'substituicao' : 'inspecao'
                });
            }
        }

        return suggestions;
    }

    async scheduleBatch(suggestions) {
        for (const s of suggestions) {
            await db.scheduleMaintenance({
                pole_id: s.pole_id,
                tipo: s.suggested_action,
                data_agendada: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
                prioridade: s.priority,
                equipe: 'Zenith Squad Alpha',
                custo: s.suggested_action === 'substituicao' ? 4500 : 350
            });
        }
        return { success: true, count: suggestions.length };
    }
}

module.exports = new MaintenanceService();
