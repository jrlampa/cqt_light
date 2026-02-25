const EngineeringService = require('../../../infrastructure/services/EngineeringService');
const DemandService = require('./DemandService');
const EfficiencyService = require('./EfficiencyService');

/**
 * TechnicalMemorialService
 * Orchestrates the generation of a comprehensive technical document.
 */
class TechnicalMemorialService {
    /**
     * Generates a structured memorial in Markdown format.
     */
    static async generateMemorial(projectData) {
        const { poles = [], consumers = [] } = projectData;
        const now = new Date().toLocaleDateString('pt-BR');

        // 1. Run all intelligence engines
        const SmartBOMService = require('./SmartBOMService');
        const smartResult = await SmartBOMService.generate(projectData);
        const { materials, metrics, optimizations } = smartResult;

        const demand = DemandService.calculateDemand(consumers);
        const efficiency = EfficiencyService.calculateTechnicalLosses(projectData);

        // Use the first pole as reference for mechanical analysis
        const mainPole = materials.find(m => m.descricao?.toUpperCase().includes('POSTE')) || { esforco_nom_dan: 300, altura_m: 11 };
        const stress = EngineeringService.calculateMechanicalStress(mainPole, poles, projectData);
        const climate = EngineeringService.simulateClimateStress(mainPole, poles, projectData);

        // 2. Build the Document
        let doc = `# MEMORIAL DESCRITIVO TÉCNICO ESTATÍSTICO\n`;
        doc += `**Projeto Zenith IQ - Inteligência de Engenharia V2.2**\n`;
        doc += `**Data de Emissão:** ${now}\n`;
        doc += `**Status do Projeto:** ${stress.status === 'SAFE' ? 'Aprovado' : 'Revisão Necessária'}\n`;
        doc += `---\n\n`;

        doc += `## 1. RESUMO EXECUTIVO DA REDE\n`;
        doc += `- **Estruturas Projetadas:** ${poles.length} unidades.\n`;
        doc += `- **Demanda Planejada:** ${demand.totalDemandWithMargin} kVA.\n`;
        doc += `- **Transformador Sugerido:** ${demand.suggestedTransformerKVA || 'N/A'} kVA.\n`;
        doc += `- **Fator de Segurança Estrutural (Ref. Poste 1):** ${stress.safetyFactor} FS.\n\n`;

        doc += `## 2. ANÁLISE DE RESILIÊNCIA CLIMÁTICA (FASE 12)\n`;
        doc += `| Cenário | Descrição | Utilização | Segurança |\n`;
        doc += `|---------|-----------|------------|-----------|\n`;

        Object.entries(climate).forEach(([name, data]) => {
            const label = name === 'operational' ? 'Normal' : name === 'storm' ? 'Tempestade (45m/s)' : 'Ruptura de Cabo';
            doc += `| ${label} | Stress Mecânico | ${data.utilizationPercent}% | ${data.status === 'SAFE' ? '✅' : '⚠️'} |\n`;
        });
        doc += `\n> **Nota de Engenharia:** O sistema simula ventos extremos (Cenário Tempestade) com aumento de 2.25x na pressão dinâmica para garantir a integridade da rede.\n\n`;

        doc += `## 3. EFICIÊNCIA ENÉRGÉTICA E IMPACTO AMBIENTAL\n`;
        doc += `- **Perdas Técnicas Estimadas:** ${efficiency.totalLossKW} kW.\n`;
        doc += `- **Custo da Ineficiência (Anual):** R$ ${efficiency.financialLossRS}.\n`;
        doc += `- **Pegada de Carbono:** ${efficiency.co2ImpactKg} kg CO2/ano evitado com otimização.\n\n`;

        doc += `## 4. ENGENHARIA DE VALOR & ANÁLISE EXECUTIVA (CAPEX VS OPEX)\n`;
        doc += `- **Investimento Inicial (Materiais):** R$ ${metrics.totalMaterial}.\n`;
        doc += `- **Investimento (Mão de Obra):** R$ ${metrics.totalLabor}.\n`;
        doc += `- **Investimento Total (CAPEX):** R$ ${metrics.totalCAPEX}.\n`;
        doc += `- **Saúde do Orçamento:** ${metrics.healthStatus} (R$ ${metrics.costPerKVA.toFixed(2)}/kVA).\n`;
        doc += `- **Custo Total de Propriedade (TCO 10 anos):** R$ ${metrics.estimatedTCO}.\n`;
        doc += `- **Economia Potencial (Value Engineering):** R$ ${metrics.potentialSavings}.\n\n`;

        doc += `### 4.1 Recomendações de Otimização Inteligente\n`;
        if (optimizations && optimizations.length > 0) {
            optimizations.forEach(o => {
                doc += `- **[${o.level}] ${o.type}**: ${o.message} (${o.impact})\n`;
            });
        } else {
            doc += `*Nenhuma otimização pendente. O projeto já utiliza o melhor custo-benefício normativo.*\n`;
        }

        doc += `\n---\n*Este documento foi gerado automaticamente pelo motor de inteligência Zenith IQ. Os cálculos seguem as normas NBR 15688 e NBR 6123.*`;

        return {
            content: doc,
            filename: `Memorial_Zenith_${now.replace(/\//g, '-')}.md`
        };
    }
}

module.exports = TechnicalMemorialService;
