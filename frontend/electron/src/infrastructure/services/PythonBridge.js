/**
 * @typedef {Object} PythonBridgeOptions
 * @property {string} pythonPath
 * @property {string} scriptPath
 */

const { spawn } = require('child_process');
const logger = require('./Logger');

class PythonBridge {
    static async run(scriptPath, projectData, pythonPath = 'python') {
        const scriptName = scriptPath.split(/[\\/]/).pop();
        logger.info(`Starting Python script: ${scriptName}`, 'PythonBridge');

        return new Promise((resolve, reject) => {
            const pyProcess = spawn(pythonPath, [scriptPath]);
            let resultData = '';
            let errorData = '';

            pyProcess.stdin.write(JSON.stringify(projectData));
            pyProcess.stdin.end();

            pyProcess.stdout.on('data', (data) => {
                resultData += data.toString();
            });

            pyProcess.stderr.on('data', (data) => {
                errorData += data.toString();
                logger.warn(`Python Stderr [${scriptName}]: ${data.toString().trim()}`, 'PythonBridge');
            });

            pyProcess.on('close', (code) => {
                if (code !== 0) {
                    const errorMsg = `Python script ${scriptName} failed (code ${code}): ${errorData}`;
                    logger.error(errorMsg, 'PythonBridge');
                    reject(new Error(errorMsg));
                    return;
                }

                try {
                    const jsonStart = resultData.indexOf('[');
                    const jsonEnd = resultData.lastIndexOf(']') + 1;

                    if (jsonStart !== -1 && jsonEnd !== -1) {
                        const parsed = JSON.parse(resultData.substring(jsonStart, jsonEnd));
                        logger.info(`Python script ${scriptName} completed successfully.`, 'PythonBridge');
                        resolve(parsed);
                    } else {
                        logger.debug(`Python output for ${scriptName} returned raw text.`, 'PythonBridge');
                        resolve(resultData);
                    }
                } catch (e) {
                    const parseError = `Failed to parse Python output from ${scriptName}: ${e.message}`;
                    logger.error(parseError, 'PythonBridge', e);
                    reject(new Error(parseError));
                }
            });

            pyProcess.on('error', (err) => {
                logger.error(`Failed to spawn Python process for ${scriptName}`, 'PythonBridge', err);
                reject(err);
            });
        });
    }
}

module.exports = PythonBridge;
