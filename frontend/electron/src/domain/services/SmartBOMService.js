const PythonBOMService = require('../../infrastructure/services/PythonBOMService');
const StructureService = require('./StructureService');
const OptimizationService = require('./OptimizationService');
const BudgetIQService = require('./BudgetIQService');
const ProjectFinancialService = require('./ProjectFinancialService');
const logger = require('../../infrastructure/services/Logger');

/**
 * SmartBOMService
 * Orchestrates Phase 11 & 17 of Zenith IQ.
 * Unifies Python base extraction with Node.js domain intelligence.
 */
class SmartBOMService {
    /**
     * Generates a complete, audited and optimized BOM.
     * @param {Object} projectData 
     */
    static async generate(projectData) {
        try {
            // 1. Base Extraction (Python)
            // This provides the materials explicitly placed on the map
            const baseResult = await PythonBOMService.generate(projectData);
            let materials = baseResult.materials || [];
            const structuresCount = (baseResult.structures || []).length;
            const poles = projectData.poles || [];

            // 2. Normative Enrichment (StructureService)
            // Add missing mandatory components for each structure
            poles.forEach(p => {
                const composition = StructureService.getComposition(p.codigo_kit || p.sap);
                composition.forEach(comp => {
                    const alreadyExists = materials.some(m => m.sap === comp.sap);
                    if (!alreadyExists) {
                        materials.push({
                            ...comp,
                            preco: 0, // Will be filled by Optimization later
                            fromZenithIQ: true,
                            reason: `Enriquecimento Normativo: ${p.codigo_kit}`
                        });
                    }
                });
            });

            // 3. Optimization & Pricing (OptimizationService)
            // Cross-reference with DB to get prices and find savings
            const optimization = OptimizationService.analyzeBOM({ ...projectData, materials });

            // 4. Financial IQ (Advanced Executive Summary)
            const financialSummary = ProjectFinancialService.calculateExecutiveSummary(materials, projectData);

            const metrics = {
                totalMaterial: financialSummary.matTotal,
                totalLabor: financialSummary.laborTotal,
                totalCAPEX: financialSummary.totalCAPEX,
                costPerKVA: financialSummary.costPerKVA,
                healthStatus: financialSummary.healthStatus,
                potentialSavings: optimization.metrics.potentialSavings,
                structuresCount,
                tcoHorizonYears: 10,
                estimatedTCO: materials.reduce((sum, m) => {
                    const tco = BudgetIQService.calculateTCO(m);
                    return sum + tco.total;
                }, 0)
            };

            return {
                materials,
                optimizations: optimization.optimizations,
                metrics,
                isCompliant: optimization.optimizations.every(o => o.level !== 'CRITICAL'),
                financial: financialSummary,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            logger.error('Smart BOM generation failed', 'SmartBOMService', error);
            throw error;
        }
    }
}

module.exports = SmartBOMService;
