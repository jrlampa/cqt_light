const AuditFlagRepository = require('../../infrastructure/repositories/AuditFlagRepository');
const logger = require('../../infrastructure/services/Logger');

class GovernanceController {
    /**
     * Registers IPC handlers for the governance module.
     * @param {Function} handle - The electron ipcMain.handle function wrapper.
     */
    static register(handle) {
        const controller = new GovernanceController();

        handle('get-audit-flags', async (_, poleId) => {
            try {
                return AuditFlagRepository.getFlags(poleId);
            } catch (error) {
                logger.error('Failed to get audit flags', 'GovernanceController', error);
                throw error;
            }
        });

        handle('add-audit-flag', async (_, flagData) => {
            try {
                return AuditFlagRepository.addFlag(flagData);
            } catch (error) {
                logger.error('Failed to add audit flag', 'GovernanceController', error);
                throw error;
            }
        });

        handle('update-audit-flag-status', async (_, { id, status }) => {
            try {
                return AuditFlagRepository.updateStatus(id, status);
            } catch (error) {
                logger.error('Failed to update audit flag status', 'GovernanceController', error);
                throw error;
            }
        });

        handle('get-governance-stats', async () => {
            try {
                return AuditFlagRepository.getStats();
            } catch (error) {
                logger.error('Failed to get governance stats', 'GovernanceController', error);
                throw error;
            }
        });
    }
}

module.exports = GovernanceController;
