const { dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const logger = require('../../infrastructure/services/Logger');

class GisController {
    /**
     * Registers IPC handlers for GIS interoperability.
     */
    static register(handle) {
        handle('export-geojson', async (_, projectData) => {
            try {
                const { poles = [], sections = [] } = projectData;

                const geojson = {
                    type: 'FeatureCollection',
                    features: []
                };

                // Add poles
                poles.forEach(p => {
                    geojson.features.push({
                        type: 'Feature',
                        geometry: {
                            type: 'Point',
                            coordinates: [p.lng, p.lat]
                        },
                        properties: {
                            id: p.id,
                            type: p.type,
                            sap: p.sap,
                            layer: 'ESTRUTURAS_BIM'
                        }
                    });
                });

                // Add sections (spans)
                sections.forEach(s => {
                    geojson.features.push({
                        type: 'Feature',
                        geometry: {
                            type: 'LineString',
                            coordinates: [
                                [s.startLng, s.startLat],
                                [s.endLng, s.endLat]
                            ]
                        },
                        properties: {
                            type: 'CONDUTOR',
                            layer: 'REDE_ELETRICA'
                        }
                    });
                });

                const { filePath } = await dialog.showSaveDialog({
                    title: 'Exportar para GIS (GeoJSON)',
                    defaultPath: path.join(process.env.USERPROFILE || process.env.HOME, 'Downloads', 'projeto_zenith.geojson'),
                    filters: [{ name: 'GeoJSON', extensions: ['geojson'] }]
                });

                if (filePath) {
                    fs.writeFileSync(filePath, JSON.stringify(geojson, null, 2));
                    return { success: true, path: filePath };
                }
                return { success: false, reason: 'cancelled' };
            } catch (error) {
                logger.error('Failed to export GeoJSON', 'GisController', error);
                throw error;
            }
        });
    }
}

module.exports = GisController;
