const OptimizationService = require('../../../services/OptimizationService');
const logger = require('../../infrastructure/services/Logger');

/**
 * OptimizationController
 * Handles IPC requests for project optimization and cost savings.
 */
class OptimizationController {
    static register(handle) {
        handle('find-cost-savings', async (_, { materials, zone }) => {
            try {
                return await OptimizationService.findCostSavings(materials, zone);
            } catch (error) {
                logger.error('Cost savings search failed', 'OptimizationController', error);
                throw error;
            }
        });
    }
}

module.exports = OptimizationController;
