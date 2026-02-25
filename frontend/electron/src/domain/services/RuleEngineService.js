const OptimizationService = require('./OptimizationService');
const EfficiencyService = require('./EfficiencyService');
const DemandService = require('./DemandService');
const StructureService = require('./StructureService');
const EngineeringService = require('../../infrastructure/services/EngineeringService');

/**
 * RuleEngineService
 * Domain service for managing engineering rules and material suggestions.
 * Integrates mechanical, electrical and demand calculations.
 */
class RuleEngineService {
    /**
     * Analyzes project data and returns technical suggestions/alerts.
     * @param {Object} projectData - The current project state.
     */
    static async getInsights(projectData) {
        const insights = [];
        const { poles = [], materials = [], condutorMT, condutorBT, consumers = [] } = projectData;

        // --- 1. DEMAND & TRANSFORMER SIZING ---
        const demand = DemandService.calculateDemand(consumers);
        if (demand.suggestedTransformerKVA > 0) {
            const sizing = DemandService.validateTransformerSizing(materials, demand);
            if (sizing && sizing.status !== 'SAFE') {
                insights.push({
                    type: 'DIMENSIONAMENTO_CARGA',
                    level: sizing.status,
                    message: sizing.message,
                    suggestedSaps: [`TRANSF-${demand.suggestedTransformerKVA}-KVA`]
                });
            }
        }

        // --- 2. ECONOMIC OPTIMIZATION ---
        const optimizationData = OptimizationService.analyzeBOM(projectData);
        optimizationData.optimizations.forEach(opt => {
            insights.push({
                type: opt.type,
                level: opt.level,
                message: opt.message,
                suggestedSaps: opt.suggestedSap ? [opt.suggestedSap] : [],
                originalSap: opt.originalSap,
                impact: opt.impact
            });
        });

        // --- 3. PHYSICAL & STRUCTURAL INTEGRITY ---

        // 3.1 Advanced Structural Audit (New StructureService)
        poles.forEach(p => {
            const structureCode = p.codigo_kit || p.sap || "";
            const integrity = StructureService.verifyIntegrity(structureCode, materials);

            if (!integrity.isValid) {
                insights.push({
                    type: 'INTEGRIDADE_ESTRUTURAL',
                    level: 'WARNING',
                    message: `${integrity.message} no poste em ${p.sap || 'P-XXX'}.`,
                    suggestedSaps: integrity.missing.map(m => StructureService.suggestCorrection(StructureService.resolveStructureType(structureCode), m))
                });
            }
        });

        // Mechanical Stress
        if (poles.length > 0) {
            const mainPole = materials.find(m => m.descricao?.toUpperCase().includes('POSTE')) || { esforco_nom_dan: 300 };
            const stress = EngineeringService.calculateMechanicalStress(
                mainPole,
                poles,
                { mt: condutorMT, bt: condutorBT }
            );

            if (stress.status !== 'SAFE') {
                insights.push({
                    type: 'ESFORCO_MECANICO',
                    level: stress.status,
                    message: stress.recommendation,
                    suggestedSaps: stress.status === 'CRITICAL' ? ['POSTE-11-600', 'POSTE-12-1000'] : []
                });
            }

            // Climate Resilience Check
            const climateScenarios = EngineeringService.simulateClimateStress(mainPole, poles, { mt: condutorMT, bt: condutorBT });
            const criticalScenario = climateScenarios.find(s => s.status === 'CRITICAL');
            if (criticalScenario) {
                insights.push({
                    type: 'RESILIENCIA_CLIMATICA',
                    level: 'WARNING',
                    message: `Risco de falha estrutural em cenário de ${criticalScenario.scenario}. FS=${criticalScenario.safetyFactor}.`,
                    suggestedSaps: ['POSTE-12-1000']
                });
            }
        }

        // Voltage Drop
        if (condutorBT && materials.some(m => m.sap?.startsWith('CAB-BT') || m.descricao?.toUpperCase().includes('MULTIPLEX'))) {
            const vdrop = EngineeringService.calculateVoltageDrop(condutorBT, 150, 40); // Average span/load
            if (vdrop.status !== 'SAFE') {
                insights.push({
                    type: 'QUEDA_TENSAO',
                    level: vdrop.status,
                    message: vdrop.message,
                    suggestedSaps: ['CABO-BT-70MM', 'CABO-BT-120MM']
                });
            }
        }

        // --- 4. LOGICAL & COMPATIBILITY RULES ---

        // Conductor vs Structure Compatibility
        const compatibility = EngineeringService.validateStructureCompatibility(poles, condutorMT);
        if (!compatibility.isValid) {
            compatibility.alerts.forEach(alert => {
                insights.push({
                    type: 'BIM_INCOMPATIBILIDADE',
                    level: alert.type,
                    message: alert.message,
                    suggestedSaps: ['K-ZENITH-SPACER-N1']
                });
            });
        }

        // --- 4. ELECTRICAL EFFICIENCY ---
        const efficiency = EfficiencyService.calculateTechnicalLosses(projectData);
        if (efficiency.status !== 'SAFE') {
            insights.push({
                type: 'EFICIENCIA_ENERGETICA',
                level: efficiency.status,
                message: efficiency.recommendation,
                impact: `Perda anual: R$ ${efficiency.financialLossRS}`
            });
        }

        // --- 5. PHASE BALANCING ---
        const balance = EngineeringService.suggestConsumerPhase(consumers);
        if (balance.isUnbalanced) {
            insights.push({
                type: 'BALANCEAMENTO_FASES',
                level: 'WARNING',
                message: `Desequilíbrio de carga detectado. Corrente de neutro estimada: ${balance.estimatedNeutralCurrentA}A.`,
                suggestedAction: `Conectar novos consumidores na fase ${balance.suggestedPhase}`
            });
        }

        return insights;
    }
}

module.exports = RuleEngineService;
