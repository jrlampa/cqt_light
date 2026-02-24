/**
 * ElectricalService
 * Handles voltage drop and electrical sizing.
 */
class ElectricalService {
    calculateVoltageDrop(conductor, distance, current = 60) {
        const rPerKm = conductor.label?.includes('35') ? 0.98 : conductor.label?.includes('70') ? 0.45 : 0.35;
        const vDrop = (current * (rPerKm / 1000) * distance * 2).toFixed(2);
        const vDropPercent = ((vDrop / 127) * 100).toFixed(1);

        return {
            voltageDropV: parseFloat(vDrop),
            dropPercent: parseFloat(vDropPercent),
            status: vDropPercent > 5 ? 'CRITICAL' : vDropPercent > 3 ? 'WARNING' : 'SAFE',
            recommendation: vDropPercent > 5 ? 'CRÍTICO: Tensão abaixo do limite PRODIST.' : 'Tensão dentro dos padrões de qualidade.'
        };
    }
}

module.exports = new ElectricalService();
