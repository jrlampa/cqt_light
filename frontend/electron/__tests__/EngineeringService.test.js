import { describe, it, expect } from 'vitest';
const EngineeringService = require('../services/EngineeringService');

describe('EngineeringService', () => {
    describe('calculateMechanicalStress', () => {
        it('should return SAFE for light loads', () => {
            const pole = { esforco_nom_dan: 300 };
            const structures = [{ codigo_kit: 'RED-1' }];
            const conductors = { mt: true, bt: true };
            const report = EngineeringService.calculateMechanicalStress(pole, structures, conductors);

            expect(report.status).toBe('SAFE');
            expect(report.utilizationPercent).toBeLessThan(80);
        });

        it('should return CRITICAL for excessive loads', () => {
            const pole = { esforco_nom_dan: 150 };
            const structures = [{ codigo_kit: 'TR-1' }, { codigo_kit: 'RED-1' }];
            const conductors = { mt: true, bt: true };
            const report = EngineeringService.calculateMechanicalStress(pole, structures, conductors);

            expect(report.status).toBe('CRITICAL');
            expect(report.utilizationPercent).toBeGreaterThan(100);
        });

        it('should account for deflection angular load', () => {
            const pole = { esforco_nom_dan: 300 };
            const structures = [];
            const conductors = { mt: true, bt: true };
            const reportNoDef = EngineeringService.calculateMechanicalStress(pole, structures, conductors, 0);
            const reportDef = EngineeringService.calculateMechanicalStress(pole, structures, conductors, 30);

            expect(reportDef.totalLoadDaN).toBeGreaterThan(reportNoDef.totalLoadDaN);
        });
    });

    describe('calculateVoltageDrop', () => {
        it('should calculate drop correctly for 35mm cable', () => {
            const conductor = { label: 'Cabo 35 mm²' };
            const report = EngineeringService.calculateVoltageDrop(conductor, 100, 50);
            expect(report.dropPercent).toBeDefined();
            expect(report.status).toBe('CRITICAL'); // 7.7% is > 5%
        });
    });

    describe('Spatial Engineering (Cycle 27)', () => {
        it('should calculate UTM distance correctly (2.5D)', () => {
            // Rules COORD: 23K 788547 7634925
            const p1 = { east: 788547, north: 7634925 };
            const p2 = { east: 788547 + 30, north: 7634925 + 40 }; // 3-4-5 triangle -> 50m
            const dist = EngineeringService.calculateSpatialDistance(p1, p2);
            expect(dist).toBe(50);
        });

        it('should auto-detect span from coordinates in calculateConductorSag', () => {
            const p1 = { east: 0, north: 0 };
            const p2 = { east: 40, north: 30 }; // 50m
            const conductor = { label: 'Cabo 35 mm²', tipo: 'Convencional' };

            const report = EngineeringService.calculateConductorSag({ conductor, p1, p2 });
            expect(report.spanM).toBe(50);
            expect(report.status).toBe('SAFE');
        });
    });
});
