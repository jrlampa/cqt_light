const materialRepo = require('../../infrastructure/repositories/MaterialRepository');
const normativeRepo = require('../../infrastructure/repositories/NormativeRepository');
const { dialog } = require('electron');
const path = require('path');
const fs = require('fs');

class MaterialController {
    static register(handle) {
        handle('get-all-materials', () => materialRepo.getAll());
        handle('search-materials', (_, query) => materialRepo.search(query));
        handle('get-materials-prices', (_, codes) => materialRepo.getPrices(codes));
        handle('upsert-material', (_, m) => materialRepo.upsert(m));

        // Price Management
        handle('get-zero-price-materials', () => materialRepo.getZeroPrice());
        handle('update-material-price', (_, { sap, price }) => materialRepo.updatePrice(sap, price));
        handle('get-material-normas', (_, sap) => normativeRepo.getNormasByMaterial(sap));

        // Export Actions
        handle('export-zero-price-csv', async () => {
            const materials = materialRepo.getZeroPrice();
            if (materials.length === 0) return { success: false, message: 'Nenhum item zerado.' };

            const { filePath } = await dialog.showSaveDialog({
                title: 'Exportar Materiais sem Preço',
                defaultPath: path.join(process.env.USERPROFILE || process.env.HOME, 'Documents', 'materiais_sem_preco.csv'),
                filters: [{ name: 'CSV', extensions: ['csv'] }]
            });

            if (filePath) {
                let csv = '\uFEFFSAP;Descricao;Unidade;Preco_Unitario\n';
                materials.forEach(m => {
                    const desc = (m.descricao || '').replace(/;/g, ',');
                    csv += `${m.sap};${desc};${m.unidade};${m.preco_unitario || 0}\n`;
                });
                fs.writeFileSync(filePath, csv);
                return { success: true, path: filePath };
            }
            return { success: false };
        });
    }
}

module.exports = MaterialController;
