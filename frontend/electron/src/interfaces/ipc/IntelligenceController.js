const NormativeRepository = require('../../infrastructure/repositories/NormativeRepository');
const logger = require('../../infrastructure/services/Logger');

class IntelligenceController {
    /**
     * Registers IPC handlers for the intelligence & norms module.
     * @param {Function} handle - The electron ipcMain.handle function wrapper.
     */
    static register(handle) {
        handle('get-norms-by-sap', async (_, sap) => {
            try {
                return NormativeRepository.getBySap(sap);
            } catch (error) {
                logger.error('Failed to get norms', 'IntelligenceController', error);
                throw error;
            }
        });

        handle('calculate-structure-health', async (_, poleData) => {
            try {
                // Predictive Maintenance Algorithm (Based on BIM Stage 2 Metadata)
                const { vida_util_anos, installed_at } = poleData;

                const yearsUsed = installed_at ? (new Date().getFullYear() - new Date(installed_at).getFullYear()) : 5;
                const health = Math.max(0, Math.min(100, ((vida_util_anos - yearsUsed) / vida_util_anos) * 100));

                let status = 'healthy';
                if (health < 30) status = 'critical';
                else if (health < 70) status = 'warning';

                return { health, status, yearsUsed };
            } catch (error) {
                logger.error('Failed to calculate health', 'IntelligenceController', error);
                return { health: 100, status: 'healthy' }; // Safe default
            }
        });

        handle('calculate-asset-health', async (_, asset) => {
            try {
                const AssetService = require('../../../services/AssetService');
                return AssetService.calculateAssetHealth(asset);
            } catch (error) {
                logger.error('Failed to calculate asset health', 'IntelligenceController', error);
                throw error;
            }
        });

        handle('assess-project-risk', async (_, assets) => {
            try {
                const AssetService = require('../../../services/AssetService');
                return AssetService.assessProjectRisk(assets);
            } catch (error) {
                logger.error('Failed to assess project risk', 'IntelligenceController', error);
                throw error;
            }
        });

        handle('suggest-labor-cost', async (_, data) => {
            try {
                const PythonBridge = require('../../../infrastructure/services/PythonBridge');
                return PythonBridge.run('ai_labor_estimator', data);
            } catch (error) {
                logger.error('AI labor estimation failed', 'IntelligenceController', error);
                throw error;
            }
        });
    }
}

module.exports = IntelligenceController;
