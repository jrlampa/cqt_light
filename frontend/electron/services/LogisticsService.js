/**
 * LogisticsService
 * Handles project mass estimation and freight calculation.
 */
class LogisticsService {
    estimateProjectWeight(materials) {
        return materials.reduce((sum, m) => {
            const desc = m.descricao.toUpperCase();
            let weight = 0;

            if (desc.includes('POSTE')) {
                const heightMatch = desc.match(/(\d+)\//);
                const height = heightMatch ? parseInt(heightMatch[1]) : 11;
                weight = height * 90 * m.quantidade;
            } else if (desc.includes('CABO') || desc.includes('MULTIPLEX')) {
                weight = (m.quantidade || 0) * 0.3;
            } else if (desc.includes('TRANSFORMADOR')) {
                weight = 400 * m.quantidade;
            } else {
                weight = m.quantidade * 2;
            }

            return sum + weight;
        }, 0);
    }

    calculateFreight(weightKg, zone) {
        const baseRate = weightKg * 0.25;
        const zoneMultiplier = zone === 'INTERIOR' ? 1.5 : zone === 'RURAL' ? 2.0 : 1.0;
        return baseRate * zoneMultiplier;
    }
}

module.exports = new LogisticsService();
