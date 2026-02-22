const auditService = require('../infrastructure/services/PythonAuditService');
const SanitizationService = require('../infrastructure/services/SanitizationService');
const cadService = require('../infrastructure/services/CADAutomationService');

class AuditProjectUseCase {
    async execute(projectData) {
        // Here we can add cross-cutting concerns like validation, logging, etc.
        // Or combining multiple infrastructure services.
        try {
            const sanitizedData = SanitizationService.sanitizeProjectData(projectData);
            const auditResults = await auditService.audit(sanitizedData);

            // Trigger Headless CAD Audit if project has a DXF path or to verify structure integrity
            // (Simulated path for now or derived from project metadata)
            const cadResults = await cadService.auditDXFQuality('project_latest.dxf');

            // Merge results
            return [...auditResults, ...cadResults];
        } catch (error) {
            console.error('[AuditProjectUseCase] Error:', error);
            throw error;
        }
    }
}

module.exports = new AuditProjectUseCase();
