const EngineeringService = require('../../infrastructure/services/EngineeringService');
const CADAutomationService = require('../../infrastructure/services/CADAutomationService');
const SanitizationService = require('../../infrastructure/services/SanitizationService');
const logger = require('../../infrastructure/services/Logger');

/**
 * EngineeringController
 * Handles technical engineering calculations for structural and electrical integrity.
 */
class EngineeringController {
    static register(handle) {
        handle('calculate-stress', async (_, data) => {
            try {
                return EngineeringService.calculateMechanicalStress(data.pole, data.structures, data.conductors);
            } catch (error) {
                logger.error('Mechanical stress calculation failed', 'EngineeringController', error);
                throw error;
            }
        });

        handle('calculate-vdrop', async (_, data) => {
            try {
                return EngineeringService.calculateVoltageDrop(data.conductor, data.distance, data.current);
            } catch (error) {
                logger.error('Voltage drop calculation failed', 'EngineeringController', error);
                throw error;
            }
        });

        handle('calculate-sag', async (_, data) => {
            try {
                return EngineeringService.calculateConductorSag(data.span, data.conductor, data.temp);
            } catch (error) {
                logger.error('Conductor sag calculation failed', 'EngineeringController', error);
                throw error;
            }
        });

        handle('validate-structures', async (_, structures) => {
            try {
                return EngineeringService.validateStructureCompatibility(structures);
            } catch (error) {
                logger.error('Structure validation failed', 'EngineeringController', error);
                throw error;
            }
        });

        handle('generate-dxf', async (_, rawData) => {
            try {
                const data = SanitizationService.sanitizeProjectData(rawData);
                return await CADAutomationService.generateDXF(data);
            } catch (error) {
                logger.error('DXF generation failed', 'EngineeringController', error);
                throw error;
            }
        });

        handle('audit-dxf', async (_, { dxfPath }) => {
            try {
                return await CADAutomationService.auditDXFQuality(dxfPath);
            } catch (error) {
                logger.error('DXF audit failed', 'EngineeringController', error);
                throw error;
            }
        });
    }
}

module.exports = EngineeringController;
