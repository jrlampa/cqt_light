/**
 * RuleEngineService
 * Domain service for managing engineering rules and material suggestions.
 * Follows clean architecture and SRP.
 */
class RuleEngineService {
    /**
     * Analyzes project data and returns technical suggestions/alerts.
     * @param {Object} projectData - The current project state (poles, sections, materials, conductors).
     * @returns {Array} - List of insights { type, level, message, suggestedSaps }.
     */
    static async getInsights(projectData) {
        const insights = [];
        const { poles = [], materials = [], condutorMT, condutorBT } = projectData;

        // Rule 1: Transformer Protection
        const transformerPoles = poles.filter(p =>
            p.sap?.startsWith('T-') || p.descricao?.toUpperCase().includes('TRANSFORMADOR')
        );

        transformerPoles.forEach(p => {
            const hasArrester = materials.some(m =>
                m.descricao?.toUpperCase().includes('PARA-RAIO') || m.sap?.startsWith('PR-')
            );
            const hasFuse = materials.some(m =>
                m.descricao?.toUpperCase().includes('CHAVE FUSIVEL') || m.sap?.startsWith('CH-')
            );

            if (!hasArrester) {
                insights.push({
                    type: 'PROTECAO_MT',
                    level: 'CRITICAL',
                    message: `Proteção incompleta no poste ${p.sap || 'T-XXX'}: Falta Para-raios.`,
                    suggestedSaps: ['PR-10KV-POLIMERICO']
                });
            }

            if (!hasFuse) {
                insights.push({
                    type: 'PROTECAO_MT',
                    level: 'CRITICAL',
                    message: `Proteção incompleta no poste ${p.sap || 'T-XXX'}: Falta Chave Fusível.`,
                    suggestedSaps: ['CH-FUSIVEL-15KV']
                });
            }
        });

        // Rule 2: Conductor vs Structure Compatibility (Spacer/Compacta)
        const isCompacta = condutorMT?.tipo === 'Compacta' || condutorMT?.label?.toUpperCase().includes('SPACER');

        if (isCompacta) {
            const nonSpacerKits = poles.filter(p =>
                p.descricao && !p.descricao.toUpperCase().includes('SPACER') &&
                !p.descricao.toUpperCase().includes('COMPACTA') &&
                !p.codigo_kit?.includes('/R') // Suffix check
            );

            if (nonSpacerKits.length > 0) {
                insights.push({
                    type: 'COMPATIBILIDADE_BIM',
                    level: 'WARNING',
                    message: `Condutor Spacer selecionado, mas ${nonSpacerKits.length} estruturas parecem ser convencionais.`,
                    suggestedSaps: ['K-ZENITH-SPACER-N1']
                });
            }
        }

        // Rule 3: Missing Suffixes in Materials
        const partials = materials.filter(m => m.sap?.endsWith('/'));
        if (partials.length > 0) {
            insights.push({
                type: 'QUALIDADE_DADOS',
                level: 'WARNING',
                message: `${partials.length} materiais estão com códigos parciais (/). O sistema tentou resolver, mas verifique o orçamento final.`,
                suggestedSaps: []
            });
        }

        // Rule 4: Dead-End structures without Anchors
        const deadEndKits = poles.filter(p =>
            p.codigo_kit?.includes('N4') || p.descricao?.toUpperCase().includes('FIM DE LINHA')
        );

        deadEndKits.forEach(p => {
            const hasAnchor = materials.some(m =>
                m.descricao?.toUpperCase().includes('ANCORAGEM') || m.descricao?.toUpperCase().includes('ESTREPO')
            );
            if (!hasAnchor) {
                insights.push({
                    type: 'MONTAGEM_MECANICA',
                    level: 'WARNING',
                    message: `Estrutura de fim de linha detectada sem conjunto de ancoragem no poste ${p.sap || ''}.`,
                    suggestedSaps: ['ANC-MT-CAA']
                });
            }
        });

        // Rule 5: Zero Price Items
        const zeroPriceItems = materials.filter(m => !m.preco_unitario || m.preco_unitario === 0);
        if (zeroPriceItems.length > 0) {
            insights.push({
                type: 'ORCAMENTO',
                level: 'WARNING',
                message: `${zeroPriceItems.length} materiais com preço zero. Isso subestima o valor global.`,
                suggestedSaps: zeroPriceItems.slice(0, 3).map(m => m.sap)
            });
        }

        return insights;
    }
}

module.exports = RuleEngineService;
