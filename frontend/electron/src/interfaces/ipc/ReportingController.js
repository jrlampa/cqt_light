const { dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const logger = require('../../infrastructure/services/Logger');

class ReportingController {
    /**
     * Registers IPC handlers for the reporting module.
     * @param {Function} handle - The electron ipcMain.handle function wrapper.
     */
    static register(handle) {
        const controller = new ReportingController();

        handle('save-pdf-report', async (_, { filename, content }) => {
            try {
                const { filePath } = await dialog.showSaveDialog({
                    title: 'Salvar Relatório de Auditoria',
                    defaultPath: path.join(process.env.USERPROFILE || process.env.HOME, 'Downloads', filename),
                    filters: [{ name: 'PDF Document', extensions: ['pdf'] }]
                });

                if (filePath) {
                    // Note: Content is expected to be a Base64 string from jspdf.output('datauristring')
                    const base64Data = content.split('base64,')[1];
                    fs.writeFileSync(filePath, base64Data, { encoding: 'base64' });

                    // Proactive: Open the file after saving
                    shell.openPath(filePath);
                    return { success: true, path: filePath };
                }
                return { success: false, reason: 'cancelled' };
            } catch (error) {
                logger.error('Failed to save PDF', 'ReportingController', error);
                throw error;
            }
        });
    }
}

module.exports = ReportingController;
