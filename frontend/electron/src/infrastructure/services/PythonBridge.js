const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const isDev = require('electron-is-dev');
const logger = require('./Logger');

class PythonBridge {
    /**
     * Executes a Python script or a standalone binary.
     * @param {string} scriptName - Name of the script/binary (e.g., 'audit_engine')
     * @param {Object} projectData - Data to send to stdin.
     * @returns {Promise<Object>} - Parsed JSON response.
     */
    static async run(scriptName, projectData) {
        let exePath;
        let args = [];

        // Determine if we use the binary or the script
        if (isDev) {
            exePath = 'python';
            args = [path.join(process.cwd(), '..', 'scripts', `${scriptName}.py`)];
        } else {
            // Production: look into extraResources (python_bin)
            const binDir = path.join(process.resourcesPath, 'python_bin');
            exePath = path.join(binDir, `${scriptName}.exe`);

            if (!fs.existsSync(exePath)) {
                logger.error(`Python binary not found: ${exePath}`, 'PythonBridge');
                throw new Error(`Dependência crítica ausente: ${scriptName}.exe`);
            }
        }

        logger.info(`Starting process: ${scriptName} (Env: ${isDev ? 'Dev' : 'Prod'})`, 'PythonBridge');

        return new Promise((resolve, reject) => {
            const process = spawn(exePath, args);
            let resultData = '';
            let errorData = '';

            process.stdin.write(JSON.stringify(projectData));
            process.stdin.end();

            process.stdout.on('data', (data) => {
                resultData += data.toString();
            });

            process.stderr.on('data', (data) => {
                errorData += data.toString();
                logger.warn(`Process Stderr [${scriptName}]: ${data.toString().trim()}`, 'PythonBridge');
            });

            process.on('close', (code) => {
                if (code !== 0) {
                    const errorMsg = `Process ${scriptName} failed (code ${code}): ${errorData}`;
                    logger.error(errorMsg, 'PythonBridge');
                    reject(new Error(errorMsg));
                    return;
                }

                try {
                    // Try parsing whole string first
                    try {
                        const parsed = JSON.parse(resultData.trim());
                        logger.info(`Process ${scriptName} completed successfully.`, 'PythonBridge');
                        resolve(parsed);
                        return;
                    } catch (e) { /* ignore and try extraction */ }

                    const jsonStart = resultData.indexOf('[');
                    const jsonEnd = resultData.lastIndexOf(']') + 1;

                    if (jsonStart !== -1 && jsonEnd !== -1) {
                        const jsonStr = resultData.substring(jsonStart, jsonEnd);
                        const parsed = JSON.parse(jsonStr);
                        logger.info(`Process ${scriptName} completed successfully (extracted array).`, 'PythonBridge');
                        resolve(parsed);
                    } else {
                        const objStart = resultData.indexOf('{');
                        const objEnd = resultData.lastIndexOf('}') + 1;
                        if (objStart !== -1 && objEnd !== -1) {
                            const jsonStr = resultData.substring(objStart, objEnd);
                            const parsed = JSON.parse(jsonStr);
                            logger.info(`Process ${scriptName} completed successfully (extracted object).`, 'PythonBridge');
                            resolve(parsed);
                        } else {
                            resolve(resultData.trim());
                        }
                    }
                } catch (e) {
                    const parseError = `Failed to parse output from ${scriptName}: ${e.message}`;
                    logger.error(parseError, 'PythonBridge', e);
                    reject(new Error(parseError));
                }
            });

            process.on('error', (err) => {
                logger.error(`Failed to spawn process for ${scriptName}`, 'PythonBridge', err);
                reject(err);
            });
        });
    }
}

module.exports = PythonBridge;
