const MaterialRepository = require('../../infrastructure/repositories/MaterialRepository');
const StructureService = require('./StructureService');
const BudgetIQService = require('./BudgetIQService');
const materialRepo = new MaterialRepository();

/**
 * OptimizationService
 * Domain service for BOM (Bill of Materials) and Budget optimization.
 */
class OptimizationService {
    /**
     * Analyzes the project BOM for optimization opportunities.
     * @param {Object} projectData - Consolidated project data.
     */
    static analyzeBOM(projectData) {
        const { materials = [], poles = [] } = projectData;
        const optimizations = [];
        let potentialSavings = 0;

        // 1. Check for Missing Prices (Integrity)
        const missingPrices = materials.filter(m => !m.preco || m.preco === 0);
        if (missingPrices.length > 0) {
            optimizations.push({
                type: 'INTEGRIDADE_PRECO',
                level: 'CRITICAL',
                message: `${missingPrices.length} materiais estão com preço ZERO no orçamento.`,
                impact: 'ALTO'
            });
        }

        // 2. Structural Component Audit (Delegated to StructureService)
        poles.forEach(p => {
            const integrity = StructureService.verifyIntegrity(p.codigo_kit || p.sap, materials);
            if (!integrity.isValid) {
                optimizations.push({
                    type: 'INTEGRIDADE_BOM',
                    level: 'WARNING',
                    message: `Audit: ${integrity.message}`,
                    impact: 'ALTO',
                    suggestedSap: StructureService.suggestCorrection(StructureService.resolveStructureType(p.codigo_kit || p.sap), integrity.missing[0])
                });
            }
        });

        // 3. Technical Value Engineering (Stress vs. Rating)
        const ValueEngineeringService = require('./ValueEngineeringService');
        const veOptimizations = ValueEngineeringService.analyzeMechanicalOptimizations(poles, materials, projectData);
        optimizations.push(...veOptimizations);

        // 4. Smart Alternatives (Fase 11 - TCO Optimization)
        for (const material of materials) {
            const alternative = this.getSmartAlternatives(material);
            if (alternative) {
                const saving = (material.preco - alternative.preco) * (material.quantidade || 1);
                const tcoSaving = (material.tcoTotal - alternative.tcoTotal) * (material.quantidade || 1);

                potentialSavings += saving;
                optimizations.push({
                    type: 'ECONOMIA_INTELIGENTE',
                    level: 'INFO',
                    message: `Substituição Inteligente: ${material.sap} por ${alternative.sap}. Melhor ROI.`,
                    impact: `Redução de TCO Est.: R$ ${tcoSaving.toFixed(2)}`,
                    suggestedSap: alternative.sap,
                    originalSap: material.sap
                });
            }
        }

        // 4. Calculate General Budget Metrics
        const totalMaterial = materials.reduce((acc, m) => acc + (m.subtotal || m.preco * (m.quantidade || 1) || 0), 0);
        const totalPolesCount = (projectData.poles || []).length || 1;
        const costPerPole = totalMaterial / totalPolesCount;

        const estimatedTCO = materials.reduce((sum, m) => {
            const tco = BudgetIQService.calculateTCO(m);
            return sum + (tco.total * (m.quantidade || 1));
        }, 0);

        return {
            optimizations,
            metrics: {
                costPerPole: costPerPole.toFixed(2),
                totalMaterial: totalMaterial.toFixed(2),
                potentialSavings: potentialSavings.toFixed(2),
                estimatedTCO: estimatedTCO.toFixed(2),
                tcoHorizonYears: 10
            }
        };
    }

    /**
     * Suggests alternatives based on TCO Score (Multi-Criterion).
     * @param {Object} material - The material to find alternative for.
     */
    static getSmartAlternatives(material) {
        if (!material.preco || material.preco === 0 || !material.descricao) return null;

        const categories = {
            'POSTE': ['POSTE', 'CONCRETO', 'MADEIRA'],
            'CABO': ['CABO', 'CONDUTOR', 'MULTIPLEX'],
            'TRANSFORMADOR': ['TRANSFORMADOR', 'TRAFO', 'PONTA'],
            'ABRAÇADEIRA': ['ABRAÇADEIRA', 'FITA', 'CINTA']
        };

        const desc = material.descricao.toUpperCase();
        const categoryKey = Object.keys(categories).find(key =>
            categories[key].some(keyword => desc.includes(keyword))
        );

        if (!categoryKey) return null;

        const primaryKeyword = categories[categoryKey][0];
        const alternatives = materialRepo.search(primaryKeyword);

        const currentTco = BudgetIQService.calculateTCO(material);
        material.tcoTotal = currentTco.total; // Link TCO to current material for metrics

        // Find alternatives with better TCO Score
        const currentScore = BudgetIQService.scoreMaterial(material);

        const betterOption = alternatives
            .map(a => {
                const tco = BudgetIQService.calculateTCO({ ...a, preco_unitario: a.preco_unitario });
                return { ...a, tco, score: BudgetIQService.scoreMaterial(a) };
            })
            .filter(a => a.sap !== material.sap && a.score > currentScore)
            .sort((a, b) => b.score - a.score)[0];

        if (betterOption) {
            return {
                sap: betterOption.sap,
                descricao: betterOption.descricao,
                preco: betterOption.preco_unitario,
                tcoTotal: betterOption.tco.total,
                score: betterOption.score
            };
        }

        return null;
    }
}

module.exports = OptimizationService;
