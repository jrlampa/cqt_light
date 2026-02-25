/**
 * EfficiencyService
 * Domain service for calculating electrical losses and energy efficiency.
 * Focuses on Joule effect losses and financial/environmental impact.
 */
class EfficiencyService {
    /**
     * Calculates power losses in the network.
     * @param {Object} projectData { materials, condutorBT, consumers }
     */
    static calculateTechnicalLosses(projectData) {
        const { condutorBT, consumers = [] } = projectData;
        if (!condutorBT || consumers.length === 0) {
            return { totalLossKW: 0, annualLossKWh: 0, financialLossRS: 0 };
        }

        // 1. Calculate Equivalent Impedance/Current (Simplified)
        const bitola = parseFloat(condutorBT.label?.match(/\d+/)?.[0]) || 35;
        const resistivity = 0.0282; // Aluminum
        const spanAvg = 35; // m
        const resistance = (resistivity * spanAvg) / bitola;

        // Total Demand in Amperes (assuming 220V)
        const totalLoadKVA = consumers.reduce((acc, c) => acc + (c.loadKVA || 1.5), 0);
        const currentA = (totalLoadKVA * 1000) / (220 * 1.73); // Three-phase approximation

        // 2. Joule Losses (P = 3 * R * I^2)
        const lossPerSpanW = 3 * resistance * Math.pow(currentA, 2);
        const numSpans = Math.max(1, Math.round(consumers.length / 3)); // Heuristic
        const totalLossKW = (lossPerSpanW * numSpans) / 1000;

        // 3. Annual Impact (assuming 30% load factor)
        const hourlyLossKWh = totalLossKW * 0.3;
        const annualLossKWh = hourlyLossKWh * 24 * 365;

        // Financial Loss (Avg 0.85 R$/kWh)
        const financialLossRS = annualLossKWh * 0.85;

        // CO2 Impact (0.09 kg CO2 per kWh - Brazil Mix avg)
        const co2ImpactKg = annualLossKWh * 0.09;

        return {
            totalLossKW: totalLossKW.toFixed(3),
            annualLossKWh: Math.round(annualLossKWh),
            financialLossRS: financialLossRS.toFixed(2),
            co2ImpactKg: Math.round(co2ImpactKg),
            status: totalLossKW > 1.5 ? 'WARNING' : 'SAFE',
            recommendation: totalLossKW > 1.5
                ? `Perdas Elevadas (${totalLossKW.toFixed(1)}kW). Recomendável aumentar bitola do secundário.`
                : 'Eficiência energética dentro da meta projetada.'
        };
    }
}

module.exports = EfficiencyService;
