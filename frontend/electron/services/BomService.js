const { spawn } = require('child_process');
const path = require('path');

class BomService {
    constructor() {
        this.pythonPath = 'python';
        this.scriptPath = path.join(__dirname, '../../../scripts/bom_generator.py');
    }

    async generateBOM(projectData) {
        return new Promise((resolve, reject) => {
            const pyProcess = spawn(this.pythonPath, [this.scriptPath]);

            let resultData = '';
            let errorData = '';

            pyProcess.stdin.write(JSON.stringify(projectData));
            pyProcess.stdin.end();

            pyProcess.stdout.on('data', (data) => {
                resultData += data.toString();
            });

            pyProcess.stderr.on('data', (data) => {
                errorData += data.toString();
            });

            pyProcess.on('close', (code) => {
                if (code !== 0) {
                    reject(new Error(`BOM Generation failed: ${errorData}`));
                    return;
                }

                try {
                    const jsonStart = resultData.indexOf('[');
                    const jsonEnd = resultData.lastIndexOf(']') + 1;

                    if (jsonStart !== -1 && jsonEnd !== -1) {
                        resolve(JSON.parse(resultData.substring(jsonStart, jsonEnd)));
                    } else {
                        resolve([]);
                    }
                } catch (e) {
                    reject(new Error('Failed to parse BOM results.'));
                }
            });
        });
    }
}

module.exports = new BomService();
