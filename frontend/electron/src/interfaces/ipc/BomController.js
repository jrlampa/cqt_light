const auditUseCase = require('../../application/AuditProjectUseCase');
const bomUseCase = require('../../application/GenerateBOMUseCase');
const logger = require('../../infrastructure/services/Logger');

class BomController {
    static register(handle) {
        handle('audit-project', async (_, projectData) => {
            return auditUseCase.execute(projectData);
        });

        handle('generate-bom', async (_, projectData) => {
            return bomUseCase.execute(projectData);
        });

        handle('rationalize-bom', async (_, { materials, structures }) => {
            try {
                const BOMService = require('../../../services/BOMService');
                return BOMService.rationalizeBOM(materials, structures);
            } catch (error) {
                logger.error('BOM rationalization failed', 'BomController', error);
                throw error;
            }
        });
    }
}

module.exports = BomController;
