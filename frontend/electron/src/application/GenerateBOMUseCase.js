const bomService = require('../infrastructure/services/PythonBOMService');
const SanitizationService = require('../infrastructure/services/SanitizationService');

class GenerateBOMUseCase {
    async execute(projectData) {
        try {
            const sanitizedData = SanitizationService.sanitizeProjectData(projectData);
            const results = await bomService.generate(sanitizedData);
            return results;
        } catch (error) {
            console.error('[GenerateBOMUseCase] Error:', error);
            throw error;
        }
    }
}

module.exports = new GenerateBOMUseCase();
