const auditUseCase = require('../../application/AuditProjectUseCase');

class AuditController {
    static register(handle) {
        handle('audit-project', async (_, projectData) => {
            return auditUseCase.execute(projectData);
        });
    }
}

module.exports = AuditController;
