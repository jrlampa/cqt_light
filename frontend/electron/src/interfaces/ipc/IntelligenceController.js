const NormativeRepository = require('../../infrastructure/repositories/NormativeRepository');
const logger = require('../../infrastructure/services/Logger');

class IntelligenceController {
    /**
     * Registers IPC handlers for the intelligence & norms module.
     * @param {Function} handle - The electron ipcMain.handle function wrapper.
     */
    static register(handle) {
        const controller = new IntelligenceController();

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
                // Score = (Life Remaining / Total Life) * 100
                const { vida_util_anos, ciclo_manutencao_meses, installed_at } = poleData;

                const yearsUsed = installed_at ? (new Date().getFullYear() - new Date(installed_at).getFullYear()) : 5; // Default 5 for mock
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

        handle('search-norms', async (_, query) => {
            try {
                return NormativeRepository.search(query);
            } catch (error) {
                logger.error('Failed to search norms', 'IntelligenceController', error);
                throw error;
            }
        });
    }
}

module.exports = IntelligenceController;
