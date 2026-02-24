const { ipcMain } = require('electron');
const logger = require('../infrastructure/services/Logger');
const AuditController = require('./ipc/AuditController');
const BomController = require('./ipc/BomController');
const MaterialController = require('./ipc/MaterialController');
const AnalyticsController = require('./ipc/AnalyticsController');
const GovernanceController = require('./ipc/GovernanceController');
const IntelligenceController = require('./ipc/IntelligenceController');
const ReportingController = require('./ipc/ReportingController');
const MaintenanceController = require('./ipc/MaintenanceController');
const GisController = require('./ipc/GisController');
const KitController = require('./ipc/KitController');
const ProjectController = require('./ipc/ProjectController');
const CompanyController = require('./ipc/CompanyController');
const SufixoController = require('./ipc/SufixoController');
const EngineeringController = require('./ipc/EngineeringController');
const OptimizationController = require('./ipc/OptimizationController');

// Future controllers will be added here
const controllers = [
    AuditController,
    BomController,
    MaterialController,
    AnalyticsController,
    GovernanceController,
    IntelligenceController,
    ReportingController,
    MaintenanceController,
    GisController,
    KitController,
    ProjectController,
    CompanyController,
    SufixoController,
    EngineeringController,
    OptimizationController
];

class ControllerRegistry {
    /**
     * Standard IPC wrapper for global error handling, logging and SANITIZATION
     */
    static safeHandle(channel, handler) {
        ipcMain.handle(channel, async (event, ...args) => {
            logger.info(`IPC Call: ${channel}`, 'ControllerRegistry');

            try {
                // Determine if we need to sanitize inputs (basic project data or query strings)
                let sanitizedArgs = args;
                const sanitizableChannels = ['project', 'audit', 'bom', 'analytics', 'engineering'];

                if (sanitizableChannels.some(c => channel.includes(c))) {
                    const SanitizationService = require('../infrastructure/services/SanitizationService');
                    sanitizedArgs = args.map(arg =>
                        (typeof arg === 'object' && arg !== null) ? SanitizationService.sanitizeProjectData(arg) : arg
                    );
                }

                const result = await handler(event, ...sanitizedArgs);
                return result;
            } catch (err) {
                logger.error(`IPC Error on ${channel}`, 'ControllerRegistry', err);
                throw err; // Propagate to frontend
            }
        });
    }

    static registerAll() {
        controllers.forEach(controller => {
            if (controller && typeof controller.register === 'function') {
                controller.register(this.safeHandle);
            }
        });
    }
}

module.exports = ControllerRegistry;
