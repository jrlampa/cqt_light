const { spawn } = require('child_process');
const path = require('path');

class AuditService {
    constructor() {
        this.pythonPath = 'python'; // Default to 'python'. Could be adjusted based on env.
        this.scriptPath = path.join(__dirname, '../../../scripts/audit_engine.py');
    }

    async auditProject(projectData) {
        return new Promise((resolve, reject) => {
            const pyProcess = spawn(this.pythonPath, [this.scriptPath]);

            let resultData = '';
            let errorData = '';

            // Send project data to Python via stdin
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
                    console.error(`Audit script failed with code ${code}: ${errorData}`);
                    reject(new Error(`Erro na auditoria: ${errorData}`));
                    return;
                }

                try {
                    // Attempt to find the JSON report in the output
                    // JSON usually starts with [ or {
                    const jsonStart = resultData.indexOf('[');
                    const jsonEnd = resultData.lastIndexOf(']') + 1;

                    if (jsonStart !== -1 && jsonEnd !== -1) {
                        const jsonPart = resultData.substring(jsonStart, jsonEnd);
                        resolve(JSON.parse(jsonPart));
                    } else {
                        // Fallback: If no JSON formatting found, return raw log if it looks like something
                        resolve([{ code: 'LOG', severity: 'INFO', message: resultData }]);
                    }
                } catch (e) {
                    console.error('Failed to parse audit output:', e, resultData);
                    reject(new Error('Falha ao processar relatório de auditoria.'));
                }
            });
        });
    }
}

module.exports = new AuditService();
