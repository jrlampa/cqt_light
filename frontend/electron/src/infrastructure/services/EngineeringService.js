/**
 * EngineeringService
 * Centralizes mechanical and electrical calculations for power systems.
 * Refined version with physical formulas (Bending Moment, Wind Load, Tension).
 */
class EngineeringService {
    // Constants for calculations
    static WIND_PRESSURE_DAN_M2 = 60; // Standard wind pressure (N/m2 or daN/m2)
    static GRAVITY = 9.81;
    static POLE_SAFETY_FACTOR = 2.0;

    /**
     * Calculates mechanical stress on a pole using Bending Moment analysis.
     * Refined with Vectorial Sum for deflection angles.
     */
    static calculateMechanicalStress(pole, structures, conductors) {
        try {
            const height = parseInt(pole.altura_m) || 11;
            const limitDaN = parseInt(pole.esforco_nom_dan) || 300;
            const embeddingDepth = (height / 10) + 0.6;
            const effectiveHeight = height - embeddingDepth;

            let totalMomentDaNm = 0;

            // 1. Moment due to Conductor Tension (Vectorial Sum)
            // T_res = sqrt(T1^2 + T2^2 + 2*T1*T2*cos(theta))
            // Simplified for constant tension T: T_res = 2 * T * sin(theta/2)
            if (conductors.mt) {
                const tensionMT = conductors.mt.label?.includes('CAA') ? 150 : 100;
                const attachmentHeightMT = effectiveHeight - 0.5;
                const deflectionAngle = 10 * (Math.PI / 180); // Default 10 deg
                const resultantTension = 2 * tensionMT * Math.sin(deflectionAngle / 2);
                totalMomentDaNm += resultantTension * attachmentHeightMT;
            }

            if (conductors.bt) {
                const tensionBT = 60; // Simplified daN
                const attachmentHeightBT = effectiveHeight - 2.5; // BT is usually lower
                const deflectionAngle = 5 * (Math.PI / 180);
                const resultantTension = 2 * tensionBT * Math.sin(deflectionAngle / 2);
                totalMomentDaNm += resultantTension * attachmentHeightBT;
            }

            // 2. Moment due to Wind on Pole (at current pressure)
            const avgDiameter = 0.25;
            const windMomentPole = this.WIND_PRESSURE_DAN_M2 * avgDiameter * Math.pow(effectiveHeight, 2) / 2;
            totalMomentDaNm += windMomentPole;

            // 3. Moment due to structures (Wind load on kits)
            totalMomentDaNm += (structures.length * 10 * effectiveHeight);

            const forceAtTopDaN = Math.round(totalMomentDaNm / effectiveHeight);
            const utilizationPercent = Math.round((forceAtTopDaN / limitDaN) * 100);
            const safetyFactor = (limitDaN / (forceAtTopDaN || 1)).toFixed(2);

            return {
                status: utilizationPercent > 90 ? 'CRITICAL' : (utilizationPercent > 70 ? 'WARNING' : 'SAFE'),
                totalLoadDaN: forceAtTopDaN,
                utilizationPercent,
                safetyFactor: parseFloat(safetyFactor),
                momentDaNm: Math.round(totalMomentDaNm),
                recommendation: utilizationPercent > 90
                    ? `Sobrecarga Crítica (${utilizationPercent}%). FS=${safetyFactor}. Recomenda-se poste reforçado.`
                    : (utilizationPercent > 70 ? `Carga elevada. FS=${safetyFactor}. Considere poste de maior esforço.` : 'Carga dentro dos limites operacionais.')
            };
        } catch (error) {
            console.error('Stress calculation error:', error);
            return { status: 'UNKNOWN', utilizationPercent: 0, safetyFactor: 0, recommendation: 'Erro ao calcular esforço.' };
        }
    }

    /**
     * Simulates structural behavior under different wind pressures.
     */
    static simulateClimateStress(pole, structures, conductors) {
        const scenarios = [
            { name: 'Normal (60 daN/m²)', pressure: 60 },
            { name: 'Tempestade (100 daN/m²)', pressure: 100 },
            { name: 'Furacão/Rajada (140 daN/m²)', pressure: 140 }
        ];

        const originalPressure = this.WIND_PRESSURE_DAN_M2;
        const results = scenarios.map(s => {
            this.WIND_PRESSURE_DAN_M2 = s.pressure;
            const stress = this.calculateMechanicalStress(pole, structures, conductors);
            return {
                scenario: s.name,
                pressure: s.pressure,
                utilization: stress.utilizationPercent,
                safetyFactor: stress.safetyFactor,
                status: stress.status
            };
        });

        this.WIND_PRESSURE_DAN_M2 = originalPressure; // Restore
        return results;
    }

    /**
     * Calculates voltage drop for a conductor.
     * Vdrop = (I * R * L * cosPhi) / V_nom
     */
    static calculateVoltageDrop(conductor, distanceM = 100, currentA = 50) {
        const resistivity = 0.0282; // Aluminum (ohm * mm2 / m)
        const cosPhi = 0.92;
        const bitola = parseFloat(conductor.label?.match(/\d+/)?.[0]) || 35;

        const resistance = (resistivity * distanceM) / bitola;
        const dropVolts = currentA * resistance * cosPhi;
        const dropPercent = ((dropVolts / 220) * 100).toFixed(2);

        return {
            dropVolts: dropVolts.toFixed(2),
            dropPercent: parseFloat(dropPercent),
            status: dropPercent > 5 ? 'CRITICAL' : (dropPercent > 3 ? 'WARNING' : 'SAFE'),
            message: dropPercent > 5
                ? `Queda de tensão de ${dropPercent}% excede o limite regulatório (5%).`
                : (dropPercent > 3 ? 'Atenção: Queda de tensão próxima ao limite.' : 'Níveis de tensão estáveis.')
        };
    }

    /**
     * Simple Sag (Flecha) Check
     */
    static calculateConductorSag(spanM, conductorType = 'CAA', tensionDaN = 100) {
        const weightKgM = conductorType === 'CAA' ? 0.25 : 0.15;
        // f = (w * L^2) / (8 * T)
        const sag = (weightKgM * Math.pow(spanM, 2)) / (8 * tensionDaN);

        return {
            sag: sag.toFixed(2),
            status: sag > 1.5 ? 'WARNING' : 'SAFE',
            message: sag > 1.5 ? 'Flecha excessiva. Verifique tração e cruzamentos.' : 'Flecha adequada.'
        };
    }

    /**
     * BIM Compatibility Check
     */
    static validateStructureCompatibility(structures, condutorMT) {
        const alerts = [];
        const isCompacta = condutorMT?.tipo === 'Compacta' || condutorMT?.label?.toUpperCase().includes('SPACER');

        structures.forEach(s => {
            const structureDesc = (s.descricao_kit || s.codigo_kit || "").toUpperCase();
            if (isCompacta && !structureDesc.includes('COMPACTA') && !structureDesc.includes('SPACER')) {
                alerts.push({
                    type: 'WARNING',
                    target: s.codigo_kit,
                    message: `Estrutura ${s.codigo_kit} pode ser incompatível com rede Compacta/Spacer.`
                });
            }
        });

        return {
            isValid: alerts.length === 0,
            alerts
        };
    }
    /**
     * Suggests the best phase to connect a new consumer to maintain balance.
     * Uses vectors to estimate Neutral Current.
     * @param {Array} existingConsumers - List of consumers with their connected phase and load.
     */
    static suggestConsumerPhase(existingConsumers) {
        const loads = { A: 0, B: 0, C: 0 };
        existingConsumers.forEach(c => {
            if (loads[c.phase] !== undefined) {
                loads[c.phase] += parseFloat(c.loadKVA || 1.5);
            }
        });

        // Current unbalance calculation
        const avg = (loads.A + loads.B + loads.C) / 3;
        const maxDev = Math.max(Math.abs(loads.A - avg), Math.abs(loads.B - avg), Math.abs(loads.C - avg));
        const unbalancePercent = avg > 0 ? (maxDev / avg) * 100 : 0;

        // Find phase with minimum load
        const phases = Object.keys(loads);
        const bestPhase = phases.reduce((min, p) => loads[p] < loads[min] ? p : min, phases[0]);

        // Calculate Neutral Current estimation (Simplified Vector Sum)
        const { A, B, C } = loads;
        const sumSq = Math.pow(A, 2) + Math.pow(B, 2) + Math.pow(C, 2);
        const interactions = (A * B + B * C + C * A);
        const neutralKVA = Math.sqrt(Math.max(0, sumSq - interactions)) || 0;

        // console.log(`DEBUG BALANCE: A=${A}, B=${B}, C=${C}, sumSq=${sumSq}, interactions=${interactions}, neutralKVA=${neutralKVA}`);

        return {
            suggestedPhase: bestPhase,
            currentBalance: loads,
            unbalancePercent: parseFloat(unbalancePercent.toFixed(1)),
            neutralKVA: parseFloat(neutralKVA.toFixed(2)),
            status: unbalancePercent > 25 ? 'CRITICAL' : (unbalancePercent > 10 ? 'WARNING' : 'SAFE'),
            recommendation: unbalancePercent > 15
                ? `Desequilíbrio de ${unbalancePercent.toFixed(1)}% detectado. Conecte novos clientes na Fase ${bestPhase}.`
                : `Balanceamento estável (${unbalancePercent.toFixed(1)}%).`
        };
    }

    /**
     * Calculates thermal losses due to phase unbalance.
     */
    static calculateNeutralLosses(neutralKVA, lengthM = 100) {
        const resistivity = 0.0282; // Aluminum
        const section = 35; // Standard neutral conductor
        const resistance = (resistivity * lengthM) / section;

        // Loss = R * I^2. Since we work with KVA at 220V: I = (KVA*1000)/220
        const currentA = (neutralKVA * 1000) / 220;
        const powerLossW = resistance * Math.pow(currentA, 2);

        return {
            powerLossW: parseFloat(powerLossW.toFixed(1)),
            financialLossAnual: parseFloat((powerLossW * 24 * 365 * 0.00085).toFixed(2)) // Cost per Wh
        };
    }
}

module.exports = EngineeringService;
