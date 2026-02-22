const path = require('path');
const PythonBridge = require('./PythonBridge');

class PythonBOMService {
    constructor() {
        this.scriptPath = path.join(__dirname, '../../../../../scripts/bom_generator.py');
    }

    async generate(projectData) {
        return PythonBridge.run(this.scriptPath, projectData);
    }
}

module.exports = new PythonBOMService();
