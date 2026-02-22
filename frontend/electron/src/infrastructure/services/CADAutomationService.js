const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const logger = require('./Logger');

/**
 * CADAutomationService
 * Orchestrates headless AutoCAD operations using accoreconsole.exe.
 * Enterprise SotA for CAD industrialization.
 */
class CADAutomationService {
    constructor() {
        // Typically located in: C:\Program Files\Autodesk\AutoCAD 20XX\accoreconsole.exe
        // User rule: assume accoreconsole.exe is available in PATH or provide a configurable mechanism.
        this.exePath = 'accoreconsole.exe';
    }

    /**
     * Executes a headless CAD operation using a script file.
     * @param {string} drawingPath - Path to the DWG/DXF file.
     * @param {string} scriptContent - AutoCAD Command script (.scr) content.
     * @returns {Promise<string>} - The console output.
     */
    async executeScript(drawingPath, scriptContent) {
        const tempScriptPath = path.join(process.cwd(), 'temp_cad_script.scr');
        fs.writeFileSync(tempScriptPath, scriptContent);

        logger.info(`Starting headless CAD operation on: ${path.basename(drawingPath)}`, 'CADAutomationService');

        return new Promise((resolve, reject) => {
            // accoreconsole.exe /i <drawing> /s <script>
            const cadProcess = spawn(this.exePath, [
                '/i', drawingPath,
                '/s', tempScriptPath
            ]);

            let output = '';
            let error = '';

            cadProcess.stdout.on('data', (data) => {
                output += data.toString();
            });

            cadProcess.stderr.on('data', (data) => {
                error += data.toString();
                logger.warn(`CAD Console Stderr: ${data.toString().trim()}`, 'CADAutomationService');
            });

            cadProcess.on('close', (code) => {
                // Cleanup script
                try { fs.unlinkSync(tempScriptPath); } catch (e) { }

                if (code !== 0 && code !== null) {
                    const msg = `CAD Console failed with code ${code}: ${error}`;
                    logger.error(msg, 'CADAutomationService');
                    reject(new Error(msg));
                    return;
                }

                logger.info('Headless CAD operation completed successfully.', 'CADAutomationService');
                resolve(output);
            });

            cadProcess.on('error', (err) => {
                logger.error('Failed to spawn accoreconsole.exe. Ensure AutoCAD is installed and in PATH.', 'CADAutomationService', err);
                reject(new Error('AutoCAD accoreconsole.exe não encontrado no sistema.'));
            });
        });
    }

    /**
     * Generates a technical report by auditing layers and blocks in a DXF.
     */
    async auditDXFQuality(dxfPath) {
        const PythonBridge = require('./PythonBridge');
        logger.debug(`Starting quality audit for: ${dxfPath}`, 'CADAutomationService');
        try {
            const results = await PythonBridge.run('dxf_auditor', { dxfPath });
            return results;
        } catch (error) {
            logger.error(`DXF Quality Audit failed: ${error.message}`, 'CADAutomationService');
            return []; // Fallback to empty results
        }
    }
}

module.exports = new CADAutomationService();
