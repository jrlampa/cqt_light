/**
 * BOMService
 * Rationalizes the Bill of Materials (BOM) with smart grouping and inventory logic.
 * Groupings: POSTES, CABOS, FERRAGENS, ISOLADORES, ACESSÓRIOS.
 */

class BOMService {
    /**
     * Categorizes a raw materials list into a structured BOM.
     * @param {Array} materials Raw material list with {sap, descricao, quantidade, unidade, preco_unitario, subtotal}
     * @returns {Object} Categorized BOM
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

            // Smart Rounding / Padding
            let qty = m.quantidade;
            if (category === 'ACESSÓRIOS' || category === 'FERRAGENS') {
                qty = Math.ceil(qty * 1.05); // 5% Slack for small parts
            } else if (category === 'CABOS') {
                qty = Math.ceil(qty * 1.03); // 3% Technical slack for wires
            }

            const item = {
                ...m,
                quantidade_ajustada: qty,
                subtotal_ajustado: qty * (m.preco_unitario || 0)
            };

            categories[category].push(item);
            grandTotal += item.subtotal_ajustado;
        });

        // Calculate Category Totals
        const summary = Object.keys(categories).map(cat => ({
            name: cat,
            itemsCount: categories[cat].length,
            total: categories[cat].reduce((sum, item) => sum + item.subtotal_ajustado, 0)
        })).filter(s => s.itemsCount > 0);

        // Analytics Estimation (Heuristics)
        const totalWeightKg = this.estimateProjectWeight(materials);
        const freightEstimate = this.calculateFreight(totalWeightKg, materials.zone || 'DEFAULT');
        const laborHours = this.estimateLaborHours(structures);

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

    /**
     * Estimates total project mass based on material heuristics.
     */
    estimateProjectWeight(materials) {
        return materials.reduce((sum, m) => {
            const desc = m.descricao.toUpperCase();
            let weight = 0;

            if (desc.includes('POSTE')) {
                // Heuristic: DT poles are heavy (approx 100kg/meter)
                const heightMatch = desc.match(/(\d+)\//);
                const height = heightMatch ? parseInt(heightMatch[1]) : 11;
                weight = height * 90 * m.quantidade;
            } else if (desc.includes('CABO') || desc.includes('MULTIPLEX')) {
                weight = (m.quantidade || 0) * 0.3; // Avg kg/m
            } else if (desc.includes('TRANSFORMADOR')) {
                weight = 400 * m.quantidade; // Avg 45-75kVA
            } else {
                weight = m.quantidade * 2; // Generic small parts avg
            }

            return sum + weight;
        }, 0);
    }

    /**
     * Calculates freight based on mass and distance zone.
     */
    calculateFreight(weightKg, zone) {
        const baseRate = weightKg * 0.25; // R$ 0.25 per kg min
        const zoneMultiplier = zone === 'INTERIOR' ? 1.5 : zone === 'RURAL' ? 2.0 : 1.0;
        return baseRate * zoneMultiplier;
    }

    /**
     * Estimates Man-Hours (HH) based on structure complexity.
     * @param {Array} structures List of structures
     */
    estimateLaborHours(structures) {
        if (!structures) return 0;

        return structures.reduce((total, s) => {
            const code = s.codigo_kit?.toUpperCase() || '';
            let hh = 1; // Default min

            if (code.startsWith('TR')) hh = 12;      // Transformer assembly
            else if (code.startsWith('N')) hh = 4;   // MT Conventional
            else if (code.startsWith('M')) hh = 6;   // MT Compact
            else if (code.startsWith('B')) hh = 2;   // BT
            else if (code.startsWith('PR') || code.startsWith('CH')) hh = 3; // Protection

            return total + hh;
        }, 0);
    }
}

module.exports = new BOMService();
