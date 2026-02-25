const { dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const logger = require('../../infrastructure/services/Logger');

class ReportingController {
    static register(handle) {
        handle('save-pdf-report', async (_, { filename, content }) => {
            try {
                const { filePath } = await dialog.showSaveDialog({
                    title: 'Salvar Relatório de Auditoria',
                    defaultPath: path.join(process.env.USERPROFILE || process.env.HOME, 'Downloads', filename),
                    filters: [{ name: 'PDF Document', extensions: ['pdf'] }]
                });

                if (filePath) {
                    const base64Data = content.split('base64,')[1];
                    fs.writeFileSync(filePath, base64Data, { encoding: 'base64' });
                    shell.openPath(filePath);
                    return { success: true, path: filePath };
                }
                return { success: false, reason: 'cancelled' };
            } catch (error) {
                logger.error('Failed to save PDF', 'ReportingController', error);
                throw error;
            }
        });

        handle('generate-technical-memorial', async (_, projectData) => {
            try {
                const TechnicalMemorialService = require('../../domain/services/TechnicalMemorialService');
                return TechnicalMemorialService.generateMemorial(projectData);
            } catch (error) {
                logger.error('Failed to generate technical memorial', 'ReportingController', error);
                throw error;
            }
        });
    }
}

module.exports = ReportingController;
