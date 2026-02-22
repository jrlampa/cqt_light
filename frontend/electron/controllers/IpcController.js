const { ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const db = require('../services/DatabaseService');

class IpcController {
    initialize() {
        this.registerMaterialsHandlers();
        this.registerKitsHandlers();
        this.registerCalculationHandlers();
        this.registerOrcamentosHandlers();
        this.registerTemplatesHandlers();
        this.registerEmpresasHandlers();
        this.registerSufixosHandlers();
        this.registerManualTemplatesHandlers();
        this.registerPriceManagementHandlers();
    }

    registerMaterialsHandlers() {
        ipcMain.handle('get-all-materials', () => db.getAllMaterials());
        ipcMain.handle('search-materials', (_, query) => db.searchMaterials(query));
        ipcMain.handle('get-materials-prices', (_, codes) => db.getMaterialsPrices(codes));
        ipcMain.handle('upsert-material', (_, m) => db.upsertMaterial(m.sap, m.descricao, m.unidade, m.preco_unitario));
    }

    registerKitsHandlers() {
        ipcMain.handle('get-all-kits', () => db.getAllKits());
        ipcMain.handle('search-kits', (_, query) => db.searchKits(query));
        ipcMain.handle('get-kit', (_, code) => db.getKit(code));
        ipcMain.handle('upsert-kit', (_, data) => db.upsertKit(data.codigoKit, data.descricaoKit, data.codigoServico, data.custoServico));
        ipcMain.handle('create-kit', (_, data) => db.createKit(data.codigo_kit, data.descricao_kit));
        ipcMain.handle('update-kit-metadata', (_, data) => db.updateKitMetadata(data.codigo_kit, data.descricao_kit));
        ipcMain.handle('delete-kit', (_, code) => db.deleteKit(code));
        ipcMain.handle('get-kit-composition', (_, code) => db.getKitComposition(code));

        // Kit Composition Edits
        ipcMain.handle('add-material-to-kit', (_, data) => db.addMaterialToKit(data.codigoKit, data.sap, data.quantidade));
        ipcMain.handle('update-kit-material-qty', (_, data) => db.updateKitMaterialQty(data.id, data.quantidade));
        ipcMain.handle('remove-material-from-kit', (_, id) => db.removeMaterialFromKit(id));
    }

    registerCalculationHandlers() {
        ipcMain.handle('get-custo-total', (_, kits) => db.getCustoTotal(kits));
        ipcMain.handle('get-stats', () => db.getStats());
    }

    registerOrcamentosHandlers() {
        ipcMain.handle('save-orcamento', (_, data) => db.saveOrcamento(data.nome, data.total, data.dados));
        ipcMain.handle('get-orcamentos', () => db.getOrcamentos());
        ipcMain.handle('get-orcamento', (_, id) => db.getOrcamento(id));
        ipcMain.handle('delete-orcamento', (_, id) => db.deleteOrcamento(id));
    }

    registerTemplatesHandlers() {
        ipcMain.handle('save-template', (_, data) => db.saveTemplate(data.nome, data.descricao, data.dados));
        ipcMain.handle('get-templates', () => db.getTemplates());
        ipcMain.handle('get-template', (_, id) => db.getTemplate(id));
        ipcMain.handle('delete-template', (_, id) => db.deleteTemplate(id));
    }

    registerEmpresasHandlers() {
        ipcMain.handle('get-all-empresas', () => db.getAllEmpresas());
        ipcMain.handle('get-empresa', (_, id) => db.getEmpresa(id));
        ipcMain.handle('create-empresa', (_, data) => db.createEmpresa(data.nome, data.contrato, data.regional));
        ipcMain.handle('update-empresa', (_, data) => db.updateEmpresa(data.id, data.nome, data.contrato, data.regional));
        ipcMain.handle('delete-empresa', (_, id) => db.deleteEmpresa(id));
        ipcMain.handle('get-empresa-ativa', () => db.getEmpresaAtiva());
        ipcMain.handle('set-empresa-ativa', (_, id) => db.setEmpresaAtiva(id));
        ipcMain.handle('get-preco-by-empresa', (_, data) => db.getPrecoByEmpresa(data.empresaId, data.sap));
        ipcMain.handle('get-all-precos-by-empresa', (_, id) => db.getAllPrecosByEmpresa(id));
        ipcMain.handle('set-preco-empresa', (_, data) => db.setPrecoEmpresa(data.empresaId, data.sap, data.precoNovo, data.origem));
        ipcMain.handle('import-precos-from-array', (_, data) => db.importPrecosFromArray(data.empresaId, data.precosArray, data.origem));
        ipcMain.handle('reajuste-em-massa', (_, data) => db.reajusteEmMassa(data.empresaId, data.percentual, data.filtroSaps));
        ipcMain.handle('get-historico-precos', (_, data) => db.getHistoricoPrecos(data.empresaId, data.limit));
    }

    registerSufixosHandlers() {
        ipcMain.handle('resolver-sufixo', (_, data) => db.resolverSufixo(data.prefixo, data.tipoContexto, data.valorContexto));
        ipcMain.handle('upsert-sufixo', (_, data) => db.upsertSufixo(data.prefixo, data.tipoContexto, data.valorContexto, data.sufixo));
        ipcMain.handle('get-sufixos-by-prefixo', (_, prefixo) => db.getSufixosByPrefixo(prefixo));
        ipcMain.handle('get-sufixos-by-contexto', (_, data) => db.getSufixosByContexto(data.tipoContexto, data.valorContexto));
        ipcMain.handle('get-all-sufixos', () => db.getAllSufixos());
    }

    registerManualTemplatesHandlers() {
        ipcMain.handle('save-template-manual', (_, data) => db.saveTemplateManual(data));
        ipcMain.handle('get-template-manual', (_, nome) => db.getTemplateManual(nome));
        ipcMain.handle('get-all-templates-manuais', () => db.getAllTemplatesManuais());
        ipcMain.handle('delete-template-manual', (_, nome) => db.deleteTemplateManual(nome));
    }

    registerPriceManagementHandlers() {
        ipcMain.handle('get-zero-price-materials', () => db.getZeroPriceMaterials());
        ipcMain.handle('update-material-price', (_, data) => db.updateMaterialPrice(data.sap, data.price));
        ipcMain.handle('update-all-kits-service-cost', (_, amount) => db.updateServiceCostForAllKits(amount));
        ipcMain.handle('get-material-normas', (_, sap) => db.getMaterialNormas(sap));
        ipcMain.handle('get-normas-for-materials', (_, saps) => db.getNormasForMaterials(saps));

        // BIM Export via Python script
        ipcMain.handle('export-bim-metadata', async () => {
            const { exec } = require('child_process');
            const scriptPath = path.join(process.cwd(), 'scripts', 'export_bim.py');
            return new Promise((resolve, reject) => {
                exec(`python "${scriptPath}"`, (err, stdout, stderr) => {
                    if (err) reject(err);
                    else resolve({ success: true, message: stdout });
                });
            });
        });

        // Services CM
        ipcMain.handle('get-all-servicos', () => db.getAllServicos());
        ipcMain.handle('search-servicos', (_, query) => db.searchServicos(query));
        ipcMain.handle('upsert-servico', (_, data) => db.upsertServico(data.codigo, data.descricao, data.precoBruto));

        // Export CSV logic moved here
        ipcMain.handle('export-zero-price-csv', async () => {
            const materials = db.getZeroPriceMaterials();
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

module.exports = new IpcController();
