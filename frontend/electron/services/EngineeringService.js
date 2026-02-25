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
        // Dynamic access to allow mocking in CJS/Vitest interop
        return (this.MechanicalService || MechanicalService).calculateMechanicalStress(pole, structures, conductors, deflection);
    }

    simulateClimateStress(pole, structures, conductors, deflection = 0) {
        return (this.MechanicalService || MechanicalService).simulateClimateStress(pole, structures, conductors, deflection);
    }

    calculateVoltageDrop(conductor, distance, current = 60) {
        return (this.ElectricalService || ElectricalService).calculateVoltageDrop(conductor, distance, current);
    }

    calculateSpatialDistance(p1, p2) {
        return (this.SpatialService || SpatialService).calculateSpatialDistance(p1, p2);
    }

    calculateConductorSag(data) {
        return (this.SpatialService || SpatialService).calculateConductorSag(data);
    }

    validateStructureCompatibility(structures) {
        return (this.ComplianceService || ComplianceService).validateStructureCompatibility(structures);
    }
}

module.exports = new EngineeringService();
