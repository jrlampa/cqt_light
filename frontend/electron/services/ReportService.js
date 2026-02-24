/**
 * ReportService
 * Automates the generation of Technical Memorials and Engineering Reports.
 * Integrates data from Engineering and Optimization services.
 */

class ReportService {
    /**
     * Generates a Technical Memorial for the project.
     * @param {Object} projectData { structures, materials, engineeringReport, costData }
     * @returns {string} Markdown-formatted memorial
     */
    generateTechnicalMemorial(projectData) {
        const { structures, engineeringReport, sagReport, costData, smartBOM } = projectData;
        const now = new Date().toLocaleString('pt-BR');

        let memorial = `# MEMORIAL DESCRITIVO TÉCNICO - ZENITH INTELLIGENCE\n`;
        memorial += `**Data de Emissão:** ${now}\n`;
        const status = (!engineeringReport || !sagReport) ? '⏳ PENDENTE' : (engineeringReport.status === 'SAFE' && sagReport.status === 'SAFE') ? '✅ APROVADO' : '⚠️ REVISÃO NECESSÁRIA';
        memorial += `**Status do Projeto:** ${status}\n\n`;

        memorial += `## 1. Escopo das Estruturas\n`;
        memorial += `O projeto contempla a instalação de ${structures.length} pontos de estrutura.\n`;
        structures.forEach((s, i) => {
            memorial += `- Ponto ${i + 1}: ${s.descricao_kit || s.nome_template} (${s.quantidade} un)\n`;
        });

        memorial += `\n## 2. Análise de Engenharia (ABNT)\n`;
        if (engineeringReport) {
            memorial += `### 2.1 Esforços Mecânicos\n`;
            memorial += `- **Carga Mecânica Calculada:** ${engineeringReport.totalLoadDaN} daN\n`;
            memorial += `- **Capacidade do Poste:** ${engineeringReport.capacityDaN} daN\n`;
            memorial += `- **Fator de Utilização:** ${engineeringReport.utilizationPercent}%\n`;
            memorial += `- **Deflexão Angular:** ${engineeringReport.deflectionAngle || 0}°\n`;
        }

        if (sagReport) {
            memorial += `### 2.2 Gabarito e Flecha\n`;
            memorial += `- **Flecha Calculada (35m):** ${sagReport.sagM}m\n`;
            memorial += `- **Distância ao Solo (Gabarito):** ${sagReport.clearanceM}m\n`;
            memorial += `- **Status Vertical:** ${sagReport.status === 'SAFE' ? 'Dentro dos limites' : 'VIOLAÇÃO DETECTADA'}\n`;
        }

        memorial += `\n### 2.3 Conclusão Técnica\n`;
        memorial += `- **Parecer:** ${engineeringReport?.recommendation || 'Análise de esforços pendente.'}\n`;

        memorial += `\n## 3. Resumo Financeiro e Materiais\n`;
        if (smartBOM) {
            memorial += `### 3.1 Grupos de Materiais (BOM Rationalized)\n`;
            smartBOM.summary.forEach(s => {
                memorial += `- **${s.name}:** R$ ${s.total.toLocaleString('pt-BR')}\n`;
            });
        }
        memorial += `\n- **VALOR TOTAL ESTIMADO:** R$ ${costData.totalGeral.toLocaleString('pt-BR')}\n`;

        memorial += `\n---\n*Gerado automaticamente pelo CQT Light - Zenith Project Assistant*`;

        return memorial;
    }
}

module.exports = new ReportService();
