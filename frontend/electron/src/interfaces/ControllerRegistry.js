const { ipcMain } = require('electron');
const logger = require('../infrastructure/services/Logger');
const AuditController = require('./ipc/AuditController');
const BomController = require('./ipc/BomController');
const MaterialController = require('./ipc/MaterialController');
const AnalyticsController = require('./ipc/AnalyticsController');
const GovernanceController = require('./ipc/GovernanceController');
const IntelligenceController = require('./ipc/IntelligenceController');
const ReportingController = require('./ipc/ReportingController');

// Future controllers will be added here
const controllers = [
    AuditController,
    BomController,
    MaterialController,
    AnalyticsController,
    GovernanceController,
    IntelligenceController,
    ReportingController
];

class ControllerRegistry {
    /**
     * Standard IPC wrapper for global error handling and logging
     */
    static safeHandle(channel, handler) {
        ipcMain.handle(channel, async (event, ...args) => {
            logger.info(`IPC Call: ${channel}`, 'ControllerRegistry');
            try {
                const result = await handler(event, ...args);
                return result;
            } catch (err) {
                logger.error(`IPC Error on ${channel}`, 'ControllerRegistry', err);
                throw err; // Propagate to frontend
            }
        });
    }

    static registerAll() {
        controllers.forEach(controller => {
            if (typeof controller.register === 'function') {
                controller.register(this.safeHandle);
            }
        });
    }
}

module.exports = ControllerRegistry;
