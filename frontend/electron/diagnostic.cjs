const path = require('path');

const controllersList = [
    ['AuditController', './src/interfaces/ipc/AuditController'],
    ['BomController', './src/interfaces/ipc/BomController'],
    ['MaterialController', './src/interfaces/ipc/MaterialController'],
    ['AnalyticsController', './src/interfaces/ipc/AnalyticsController'],
    ['GovernanceController', './src/interfaces/ipc/GovernanceController'],
    ['IntelligenceController', './src/interfaces/ipc/IntelligenceController'],
    ['ReportingController', './src/interfaces/ipc/ReportingController'],
    ['MaintenanceController', './src/interfaces/ipc/MaintenanceController'],
    ['GisController', './src/interfaces/ipc/GisController']
];

console.log('--- Zenith Diagnostic: Checking Controllers ---');

controllersList.forEach(([name, cPath]) => {
    try {
        const fullPath = path.resolve(__dirname, cPath);
        const controller = require(fullPath);
        console.log(`[OK] ${name}: ${typeof controller} - hasRegister: ${typeof controller.register === 'function'}`);
    } catch (err) {
        console.error(`[FAIL] ${name}: ${err.message}`);
        if (err.stack) {
            // Print first line of stack to see where it failed
            console.error('      ' + err.stack.split('\n')[1].trim());
        }
    }
});

console.log('--- Diagnostic Complete ---');
