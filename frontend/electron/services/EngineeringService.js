/**
 * EngineeringService
 * Coordinator for automated engineering calculations.
 * Aligned with SRP: Delegates to specialized sub-services.
 */
const MechanicalService = require('./engineering/MechanicalService');
const ElectricalService = require('./engineering/ElectricalService');
const SpatialService = require('./engineering/SpatialService');
const ComplianceService = require('./engineering/ComplianceService');

class EngineeringService {
    calculateMechanicalStress(pole, structures, conductors, deflection = 0) {
        return MechanicalService.calculateMechanicalStress(pole, structures, conductors, deflection);
    }

    calculateVoltageDrop(conductor, distance, current = 60) {
        return ElectricalService.calculateVoltageDrop(conductor, distance, current);
    }

    calculateSpatialDistance(p1, p2) {
        return SpatialService.calculateSpatialDistance(p1, p2);
    }

    calculateConductorSag(data) {
        return SpatialService.calculateConductorSag(data);
    }

    validateStructureCompatibility(structures) {
        return ComplianceService.validateStructureCompatibility(structures);
    }
}

module.exports = new EngineeringService();
