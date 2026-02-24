const RuleEngineService = require('../../domain/services/RuleEngineService');
const Logger = require('../../infrastructure/services/Logger');

/**
 * DesignerAssistantController
 * Orchestrates engineering assistance via IPC.
 */
class DesignerAssistantController {
    static register(handle) {
        handle('get-designer-insights', async (_, projectData) => {
            return DesignerAssistantController.inspectProject(projectData);
        });
    }

    /**
     * Inspects the current project and returns actionable insights.
     * @param {Object} projectData 
     */
    static async inspectProject(projectData) {
        try {
            Logger.info('Inspecting project for designer insights...', 'DesignerAssistantController');
            const insights = await RuleEngineService.getInsights(projectData);

            // Add technical scores (Half-way BIM)
            const qualityScore = Math.max(0, 100 - (insights.length * 10));

            return {
                insights,
                stats: {
                    qualityScore,
                    isCompliant: insights.filter(i => i.level === 'CRITICAL').length === 0,
                    lastInspection: new Date().toISOString()
                }
            };
        } catch (error) {
            Logger.error('Failed to inspect project', 'DesignerAssistantController', error);
            throw error;
        }
    }
}

module.exports = DesignerAssistantController;
