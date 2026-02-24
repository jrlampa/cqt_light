/**
 * ComplianceService
 * Orchestrates engineering standards and attachment safety rules.
 */
class ComplianceService {
    validateStructureCompatibility(structures) {
        if (!structures || structures.length === 0) return { status: 'SAFE', alerts: [] };

        const alerts = [];
        const codes = structures.map(s => s.codigo_kit?.toUpperCase() || '');

        const hasMT = codes.some(c => c.startsWith('N') || c.startsWith('M'));
        const hasBT = codes.some(c => c.startsWith('B') || c.startsWith('CE'));
        const hasTransformer = codes.some(c => c.includes('TR'));
        const hasProtection = codes.some(c => c.includes('PR') || c.includes('CH'));

        if (hasMT && hasBT) {
            alerts.push({ type: 'INFO', message: 'Coexistência MT/BT: Garantir separação mínima de 1.2m no poste.' });
        }
        if (hasTransformer && !hasProtection) {
            alerts.push({ type: 'CRITICAL', message: 'VIOLAÇÃO: Transformador detectado sem estrutura de proteção/chaves.' });
        }
        const trCount = codes.filter(c => c.includes('TR')).length;
        if (trCount > 1) {
            alerts.push({ type: 'WARNING', message: 'ALERTA: Múltiplos transformadores no mesmo poste. Verificar limite de esforço.' });
        }

        return {
            status: alerts.some(a => a.type === 'CRITICAL') ? 'CRITICAL' : alerts.some(a => a.type === 'WARNING') ? 'WARNING' : 'SAFE',
            alerts
        };
    }
}

module.exports = new ComplianceService();
