/**
 * MechanicalService
 * Handles structural analysis and mechanical stress on poles.
 */
class MechanicalService {
    calculateMechanicalStress(pole, structures, conductors, deflection = 0) {
        const poleStrength = pole.esforco_nom_dan || 300;
        let totalLoad = 0;

        // 1. Structure Vertical & Wind Loads
        structures.forEach(s => {
            if (s.codigo_kit?.includes('RED')) totalLoad += 60;
            if (s.codigo_kit?.includes('TR')) totalLoad += 180;
        });

        // 2. Conductor Transversal Load (Wind)
        const windLoad = (conductors.mt ? 45 : 0) + (conductors.bt ? 35 : 0);
        totalLoad += windLoad;

        // 3. Deflection Load (Angular Tension)
        const mtTension = conductors.mt ? 150 : 0;
        const btTension = conductors.bt ? 100 : 0;
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
}

module.exports = new MechanicalService();
