const materialRepo = require('../../infrastructure/repositories/MaterialRepository');
const logger = require('../../infrastructure/services/Logger');

/**
 * AnalyticsController
 * Orchestrates business intelligence and technical stats for project management.
 */
class AnalyticsController {
    static register(handle) {
        handle('get-project-analytics', async (_, projectData) => {
            return AnalyticsController.getProjectAnalytics(projectData);
        });
    }

    /**
     * Calculates project-wide analytics including BIM and DXF statistics.
     * @param {Object} projectData - The sanitized project payload.
     * @returns {Object} - Enriched analytics report.
     */
    static async getProjectAnalytics(projectData) {
        logger.info(`Generating analytics for project: ${projectData.name || 'Unnamed'}`, 'AnalyticsController');

        try {
            // Efficiently extract SAPs in a single pass if possible
            const saps = new Set([
                ...(projectData.poles || []).map(p => p.sap),
                ...(projectData.sections || []).map(s => s.sap),
                ...(projectData.transformers || []).map(t => t.sap)
            ].filter(Boolean));

            const sapList = Array.from(saps);
            const materialData = materialRepo.getPrices(sapList);

            const materialLookup = new Map(materialData.map(m => [m.sap, m]));

            let maintenanceTotal = 0;
            let lifecycleTotal = 0;
            let itemsWithMetadata = 0;

            sapList.forEach(sap => {
                const meta = materialLookup.get(sap);
                if (meta) {
                    maintenanceTotal += meta.ciclo_manutencao_meses || 24;
                    lifecycleTotal += meta.vida_util_anos || 30;
                    itemsWithMetadata++;
                }
            });

            const itemsCount = Math.max(sapList.length, 1);
            const avgMaintenance = itemsWithMetadata > 0 ? (maintenanceTotal / itemsWithMetadata) : 24;
            const avgLifecycle = itemsWithMetadata > 0 ? (lifecycleTotal / itemsWithMetadata) : 30;
            const bimScore = (itemsWithMetadata / itemsCount) * 100;

            // Simplified DXF Score placeholder (Stage 2 implementation)
            const dxfQualityFactor = projectData.metadata?.dxf_layers_count ? Math.min(100, (projectData.metadata.dxf_layers_count / 10) * 100) : 0;

            return {
                summary: {
                    polesCount: projectData.poles?.length || 0,
                    conductorsCount: projectData.sections?.length || 0,
                    materialsCount: sapList.length,
                    avgMaintenanceMonths: Math.round(avgMaintenance),
                    avgLifecycleYears: Math.round(avgLifecycle)
                },
                bim: {
                    score: Math.round(bimScore),
                    maturityLevel: bimScore > 90 ? 2 : 1,
                    status: bimScore > 80 ? 'READY_FOR_EXECUTION' : 'PLANNING'
                },
                dxf: {
                    score: Math.round(dxfQualityFactor),
                    status: dxfQualityFactor > 50 ? 'VALIDATED' : 'PENDING'
                }
            };

        } catch (error) {
            logger.error('Failed to generate project analytics', 'AnalyticsController', error);
            throw error;
        }
    }
}

module.exports = AnalyticsController;
