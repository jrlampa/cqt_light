const RuleEngineService = require('../../domain/services/RuleEngineService');
const EngineeringService = require('../../infrastructure/services/EngineeringService');
const DemandService = require('../../domain/services/DemandService');
const OptimizationService = require('../../domain/services/OptimizationService');
const EfficiencyService = require('../../domain/services/EfficiencyService');
const Logger = require('../../infrastructure/services/Logger');

/**
 * DesignerAssistantController
 * Orchestrates engineering assistance via IPC.
 * Now supports demand calculations and refined stress metrics.
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
            const { poles = [], materials = [], condutorMT, condutorBT, consumers = [] } = projectData;

            // 1. Get Actionable Insights
            const insights = await RuleEngineService.getInsights(projectData);

            // 2. Perform Physical Calculations for UI Stats
            const mainPole = materials.find(m => m.descricao?.toUpperCase().includes('POSTE')) || { esforco_nom_dan: 300, altura_m: 11 };
            const stress = EngineeringService.calculateMechanicalStress(mainPole, poles, { mt: condutorMT, bt: condutorBT });

            // 3. Perform Demand Calculation
            const demand = DemandService.calculateDemand(consumers);
            const vdrop = EngineeringService.calculateVoltageDrop(condutorBT || { label: 'Multiplex 35mm' }, 150, 40);
            const optimization = OptimizationService.analyzeBOM(projectData);
            const climateScenarios = EngineeringService.simulateClimateStress(mainPole, poles, { mt: condutorMT, bt: condutorBT });
            const efficiency = EfficiencyService.calculateTechnicalLosses(projectData);
            const balancing = EngineeringService.suggestConsumerPhase(consumers);
            const neutralLosses = EngineeringService.calculateNeutralLosses(balancing.neutralKVA, 150);

            // Calculate Project Health Score (Penalize for insights/critical issues)
            const criticalCount = insights.filter(i => i.level === 'CRITICAL').length;
            const warningCount = insights.filter(i => i.level === 'WARNING').length;
            const healthScore = Math.max(0, 100 - (criticalCount * 20) - (warningCount * 5));

            return {
                insights,
                stats: {
                    qualityScore: healthScore,
                    isCompliant: criticalCount === 0,
                    potentialSavings: optimization.metrics.potentialSavings,
                    stressLevel: stress.status,
                    stressPercent: stress.utilizationPercent,
                    safetyFactor: stress.safetyFactor,
                    climateScenarios,
                    technicalLossKW: efficiency.totalLossKW,
                    annualLossRS: efficiency.financialLossRS,
                    neutralKVA: balancing.neutralKVA,
                    neutralLossW: neutralLosses.powerLossW,
                    unbalancePercent: balancing.unbalancePercent,
                    balancingStatus: balancing.status,
                    loadDaN: stress.totalLoadDaN,
                    demandKVA: demand.totalDemandWithMargin,
                    suggestedTransf: demand.suggestedTransformerKVA,
                    vdropPercent: vdrop.dropPercent,
                    vdropLevel: vdrop.status,
                    costPerPole: optimization.metrics.costPerPole,
                    estimatedTCO: optimization.metrics.estimatedTCO,
                    tcoHorizonYears: optimization.metrics.tcoHorizonYears,
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
