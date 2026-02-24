/**
 * BOMService
 * Rationalizes the Bill of Materials (BOM) with smart grouping and inventory logic.
 * Aligned with SRP: Delegates logistics and labor to dedicated services.
 */
const LogisticsService = require('./LogisticsService');
const LaborService = require('./LaborService');

class BOMService {
    /**
     * Categorizes a raw materials list into a structured BOM.
     * @param {Array} materials Raw material list
     * @param {Array} structures List of structures for labor calculation
     * @returns {Object} Categorized BOM with Analytics
     */
    rationalizeBOM(materials, structures = []) {
        const categories = {
            'POSTES': [],
            'CABOS': [],
            'FERRAGENS': [],
            'ISOLADORES': [],
            'ACESSÓRIOS': [],
            'SERVIÇOS': [],
            'OUTROS': []
        };

        let grandTotal = 0;

        materials.forEach(m => {
            const desc = m.descricao.toUpperCase();
            let category = 'OUTROS';

            if (desc.includes('POSTE')) category = 'POSTES';
            else if (desc.includes('MAO DE OBRA') || desc.includes('MÃO DE OBRA')) category = 'SERVIÇOS';
            else if (desc.includes('CABO') || desc.includes('MULTIPLEX') || desc.includes('CONDUTOR')) category = 'CABOS';
            else if (desc.includes('SUPORTE') || desc.includes('FERRAGEM')) category = 'FERRAGENS';
            else if (desc.includes('ISOLADOR')) category = 'ISOLADORES';
            else if (desc.includes('PARAFUSO') || desc.includes('ARRUELA') || desc.includes('PORCA') || desc.includes('CINTA')) category = 'ACESSÓRIOS';

            let qty = m.quantidade;
            if (category === 'ACESSÓRIOS' || category === 'FERRAGENS') {
                qty = Math.ceil(qty * 1.05);
            } else if (category === 'CABOS') {
                qty = Math.ceil(qty * 1.03);
            }

            const item = {
                ...m,
                quantidade_ajustada: qty,
                subtotal_ajustado: qty * (m.preco_unitario || 0)
            };

            categories[category].push(item);
            grandTotal += item.subtotal_ajustado;
        });

        const summary = Object.keys(categories).map(cat => ({
            name: cat,
            itemsCount: categories[cat].length,
            total: categories[cat].reduce((sum, item) => sum + item.subtotal_ajustado, 0)
        })).filter(s => s.itemsCount > 0);

        // Delegation (SRP)
        const totalWeightKg = LogisticsService.estimateProjectWeight(materials);
        const freightEstimate = LogisticsService.calculateFreight(totalWeightKg, materials.zone || 'DEFAULT');
        const laborHours = LaborService.estimateLaborHours(structures);

        return {
            categories,
            summary,
            analytics: {
                totalWeightKg: Math.round(totalWeightKg),
                freightEstimate: Math.round(freightEstimate),
                laborHours: Math.round(laborHours),
                logisticsMessage: totalWeightKg > 2000 ? 'Logística pesada detectada: requer comboio/munck.' : 'Logística padrão.'
            },
            grandTotal: grandTotal + freightEstimate
        };
    }

    estimateProjectWeight(materials) {
        return LogisticsService.estimateProjectWeight(materials);
    }

    calculateFreight(weightKg, zone) {
        return LogisticsService.calculateFreight(weightKg, zone);
    }

    estimateLaborHours(structures) {
        return LaborService.estimateLaborHours(structures);
    }
}

module.exports = new BOMService();
