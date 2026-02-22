const MaintenanceRepository = require('../../infrastructure/repositories/MaintenanceRepository');
const logger = require('../../infrastructure/services/Logger');

class MaintenanceController {
    static register(handle) {
        handle('schedule-maintenance', async (_, jobData) => {
            try {
                return MaintenanceRepository.schedule(jobData);
            } catch (error) {
                logger.error('Failed to schedule maintenance', 'MaintenanceController', error);
                throw error;
            }
        });

        handle('get-maintenance-jobs', async () => {
            try {
                return MaintenanceRepository.getAll();
            } catch (error) {
                logger.error('Failed to get maintenance jobs', 'MaintenanceController', error);
                throw error;
            }
        });
    }
}

module.exports = MaintenanceController;
