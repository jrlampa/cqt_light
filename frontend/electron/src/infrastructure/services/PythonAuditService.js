const path = require('path');
const PythonBridge = require('./PythonBridge');

class PythonAuditService {
    constructor() {
        this.scriptPath = path.join(__dirname, '../../../../../scripts/audit_engine.py');
    }

    async audit(projectData) {
        return PythonBridge.run('audit_engine', projectData);
    }
}

module.exports = new PythonAuditService();
