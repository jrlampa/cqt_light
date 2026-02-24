const materialRepo = require('../../infrastructure/repositories/MaterialRepository');
const logger = require('../../infrastructure/services/Logger');
const SanitizationService = require('../../infrastructure/services/SanitizationService');

/**
 * AnalyticsController
 * Orchestrates business intelligence and technical stats for project management.
 * Part of the Cycle 5 SotA implementation.
 */
class AnalyticsController {
    static register(handle) {
        const controller = new AnalyticsController();
        handle('get-project-analytics', async (_, projectData) => {
            const sanitized = SanitizationService.sanitizeProjectData(projectData);
            return controller.getProjectAnalytics(sanitized);
        });
    }

    /**
     * Calculates project-wide analytics including BIM and DXF statistics.
     * @param {Object} projectData - The sanitized project payload.
     * @returns {Object} - Enriched analytics report.
     */
    async getProjectAnalytics(projectData) {
        logger.info(`Generating analytics for project: ${projectData.name || 'Unnamed'}`, 'AnalyticsController');

        try {
            // Extract all SAPs from poles, sections, and transformers
            const saps = new Set();
            projectData.poles?.forEach(p => { if (p.sap) saps.add(p.sap); });
            projectData.sections?.forEach(s => { if (s.sap) saps.add(s.sap); });
            projectData.transformers?.forEach(t => { if (t.sap) saps.add(t.sap); });

            const sapList = Array.from(saps);
            const materialData = materialRepo.getPrices(sapList);

            // Map metadata to a lookup
            const materialLookup = {};
            materialData.forEach(m => {
                materialLookup[m.sap] = m;
            });

            // Calculate BIM Maturity (Stage 2)
            let maintenanceTotal = 0;
            let lifecycleTotal = 0;
            let itemsWithMetadata = 0;

            sapList.forEach(sap => {
                const meta = materialLookup[sap];
                if (meta) {
                    maintenanceTotal += meta.ciclo_manutencao_meses || 24;
                    lifecycleTotal += meta.vida_util_anos || 30;
                    itemsWithMetadata++;
                }
            });

            const avgMaintenance = itemsWithMetadata > 0 ? (maintenanceTotal / itemsWithMetadata) : 24;
            const avgLifecycle = itemsWithMetadata > 0 ? (lifecycleTotal / itemsWithMetadata) : 30;

            const bimScore = (itemsWithMetadata / Math.max(sapList.length, 1)) * 100;

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
                    status: bimScore > 90 ? 'READY_FOR_EXECUTION' : 'PLANNING'
                },
                dxf: {
                    score: 0, // TBD: Implement real DXF quality audit
                    status: 'PENDING'
                }
            };

        } catch (error) {
            logger.error('Failed to generate project analytics', 'AnalyticsController', error);
            throw error;
        }
    }
}

module.exports = AnalyticsController;
