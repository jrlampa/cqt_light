/**
 * SpatialService
 * Handles GPS/UTM coordinates and conductor sag (flecha) analysis.
 */
class SpatialService {
    calculateSpatialDistance(p1, p2) {
        if (!p1 || !p2) return 0;
        if (p1.east !== undefined && p1.north !== undefined && p2.east !== undefined && p2.north !== undefined) {
            return Math.sqrt(Math.pow(p2.east - p1.east, 2) + Math.pow(p2.north - p1.north, 2));
        }
        if (p1.lat !== undefined && p1.lng !== undefined && p2.lat !== undefined && p2.lng !== undefined) {
            const R = 6371e3;
            const phi1 = p1.lat * Math.PI / 180;
            const phi2 = p2.lat * Math.PI / 180;
            const dPhi = (p2.lat - p1.lat) * Math.PI / 180;
            const dLambda = (p2.lng - p1.lng) * Math.PI / 180;
            const a = Math.sin(dPhi / 2) * Math.sin(dPhi / 2) +
                Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) * Math.sin(dLambda / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return R * c;
        }
        return 0;
    }

    calculateConductorSag(data) {
        const { conductor, temp = 25, p1, p2 } = data;
        let span = data.span;
        if (!span && p1 && p2) span = this.calculateSpatialDistance(p1, p2);
        if (!span) span = 35;

        const weightKgM = conductor.label?.includes('35') ? 0.15 : conductor.label?.includes('70') ? 0.28 : 0.35;
        const tensionDaN = conductor.tipo?.includes('Compacta') ? 250 : 150;
        const sag = (weightKgM * Math.pow(span, 2)) / (8 * tensionDaN);

        const minClearance = 6.0;
        const targetPoleHeight = 11;
        const effectiveHeight = targetPoleHeight - 1.5 - sag;

        return {
            spanM: parseFloat(span.toFixed(2)),
            sagM: parseFloat(sag.toFixed(2)),
            clearanceM: parseFloat(effectiveHeight.toFixed(2)),
            status: effectiveHeight < minClearance || span > 60 ? 'CRITICAL' : effectiveHeight < (minClearance + 0.5) ? 'WARNING' : 'SAFE',
            recommendation: effectiveHeight < minClearance
                ? `CRÍTICO: Gabarito insuficiente (${effectiveHeight}m).`
                : span > 60 ? 'CRÍTICO: Vão excessivo (>60m). Requer estrutura reforçada.' : 'Gabarito vertical em conformidade.'
        };
    }
}

module.exports = new SpatialService();
