/**
 * EngineeringService
 * Core engine for automated engineering calculations.
 * Supports mechanical stress (poles) and electrical (BT/MT) validations.
 * Aligned with ABNT and Zenith Standards.
 */

class EngineeringService {
    /**
     * Calculates mechanical stress on a pole.
     * @param {Object} pole Pole data
     * @param {Array} structures Structures attached
     * @param {Object} conductors Wire data
     * @param {number} deflection Angle of deflection in degrees
     * @returns {Object} Stress report
     */
    calculateMechanicalStress(pole, structures, conductors, deflection = 0) {
        const poleStrength = pole.esforco_nom_dan || 300;
        let totalLoad = 0;

        // 1. Structure Vertical & Wind Loads
        structures.forEach(s => {
            if (s.codigo_kit?.includes('RED')) totalLoad += 60;  // ABNT average
            if (s.codigo_kit?.includes('TR')) totalLoad += 180; // Scaled for TR weight
        });

        // 2. Conductor Transversal Load (Wind)
        const windLoad = (conductors.mt ? 45 : 0) + (conductors.bt ? 35 : 0);
        totalLoad += windLoad;

        // 3. Deflection Load (Angular Tension)
        // Engineering: F_res = 2 * T * sin(theta/2)
        const mtTension = conductors.mt ? 150 : 0; // daN
        const btTension = conductors.bt ? 100 : 0; // daN
        const totalTension = mtTension + btTension;
        const angularLoad = 2 * totalTension * Math.sin((deflection * Math.PI / 180) / 2);

        totalLoad += angularLoad;

        const utilization = ((totalLoad / poleStrength) * 100).toFixed(1);
        const safetyFactor = (poleStrength / totalLoad).toFixed(2);

        let recommendation = 'Condição operacional adequada.';
        if (utilization > 95) recommendation = 'CRÍTICO: Substituir por poste de maior esforço IMEDIATAMENTE.';
        else if (utilization > 80) recommendation = 'ALERTA: Adicionar estai (âncora) para compensar carga angular ou longitudinal.';
        else if (deflection > 5 && utilization > 50) recommendation = 'Sugerido adicionar contra-estai devido à deflexão angular.';

        return {
            totalLoadDaN: parseFloat(totalLoad.toFixed(2)),
            capacityDaN: poleStrength,
            utilizationPercent: parseFloat(utilization),
            safetyFactor: parseFloat(safetyFactor),
            deflectionAngle: deflection,
            status: utilization > 95 ? 'CRITICAL' : utilization > 80 ? 'WARNING' : 'SAFE',
            recommendation
        };
    }

    /**
     * Estimates voltage drop (BT).
     */
    calculateVoltageDrop(conductor, distance, current = 60) {
        // Vdrop = I * (R*cos + X*sin) * L * 2 -> Simplified
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

    /**
     * Calculates distance between two points (Spatial 2.5D).
     * Supports UTM (Rules COORD) and Lat/Lng (Haversine).
     */
    calculateSpatialDistance(p1, p2) {
        if (!p1 || !p2) return 0;

        // 1. UTM (User Rules provided 23K 788547 7634925 format)
        if (p1.east !== undefined && p1.north !== undefined && p2.east !== undefined && p2.north !== undefined) {
            return Math.sqrt(Math.pow(p2.east - p1.east, 2) + Math.pow(p2.north - p1.north, 2));
        }

        // 2. Lat/Lng (Haversine)
        if (p1.lat !== undefined && p1.lng !== undefined && p2.lat !== undefined && p2.lng !== undefined) {
            const R = 6371e3; // Earth radius in meters
            const phi1 = p1.lat * Math.PI / 180;
            const phi2 = p2.lat * Math.PI / 180;
            const dPhi = (p2.lat - p1.lat) * Math.PI / 180;
            const dLambda = (p2.lng - p1.lng) * Math.PI / 180;

            const a = Math.sin(dPhi / 2) * Math.sin(dPhi / 2) +
                Math.cos(phi1) * Math.cos(phi2) *
                Math.sin(dLambda / 2) * Math.sin(dLambda / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

            return R * c;
        }

        return 0;
    }

    /**
     * Calculates conductor sag (Flecha) based on parabolic approximation.
     * @param {Object} data { span, conductor, temp, p1, p2 }
     * @returns {Object} Sag report
     */
    calculateConductorSag(data) {
        const { conductor, temp = 25, p1, p2 } = data;
        let span = data.span;

        // Auto-detect span from coordinates if available
        if (!span && p1 && p2) {
            span = this.calculateSpatialDistance(p1, p2);
        }

        if (!span) span = 35; // Fallback

        // Properties (approximate for calculation)
        const weightKgM = conductor.label?.includes('35') ? 0.15 : conductor.label?.includes('70') ? 0.28 : 0.35;
        const tensionDaN = conductor.tipo?.includes('Compacta') ? 250 : 150; // Higher tension for spacer cables

        // Sag Formula (Parabolic): f = (w * L^2) / (8 * T)
        const sag = (weightKgM * Math.pow(span, 2)) / (8 * tensionDaN);

        // Gabarito Check (ABNT NBR 15688)
        const minClearance = 6.0; // Distance to ground (Urban road)
        const targetPoleHeight = 11; // Standard pole
        const effectiveHeight = targetPoleHeight - 1.5 - sag; // 1.5m burial + sag

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

    /**
     * Validates compatibility between structures on the same pole.
     * @param {Array} structures List of structures
     * @returns {Object} Compatibility report
     */
    validateStructureCompatibility(structures) {
        if (!structures || structures.length === 0) return { status: 'SAFE', alerts: [] };

        const alerts = [];
        const codes = structures.map(s => s.codigo_kit?.toUpperCase() || '');

        const hasMT = codes.some(c => c.startsWith('N') || c.startsWith('M'));
        const hasBT = codes.some(c => c.startsWith('B') || c.startsWith('CE'));
        const hasTransformer = codes.some(c => c.includes('TR'));
        const hasProtection = codes.some(c => c.includes('PR') || c.includes('CH'));

        // Rule 1: MT/BT Coexistence requires minimum space
        if (hasMT && hasBT) {
            alerts.push({
                type: 'INFO',
                message: 'Coexistência MT/BT: Garantir separação mínima de 1.2m no poste.'
            });
        }

        // Rule 2: Transformer without protection is a violation
        if (hasTransformer && !hasProtection) {
            alerts.push({
                type: 'CRITICAL',
                message: 'VIOLAÇÃO: Transformador detectado sem estrutura de proteção/chaves.'
            });
        }

        // Rule 3: Multiple Transformers on single pole (Mechanical limit)
        const trCount = codes.filter(c => c.includes('TR')).length;
        if (trCount > 1) {
            alerts.push({
                type: 'WARNING',
                message: 'ALERTA: Múltiplos transformadores no mesmo poste. Verificar limite de esforço.'
            });
        }

        return {
            status: alerts.some(a => a.type === 'CRITICAL') ? 'CRITICAL' : alerts.some(a => a.type === 'WARNING') ? 'WARNING' : 'SAFE',
            alerts
        };
    }
}

module.exports = new EngineeringService();
