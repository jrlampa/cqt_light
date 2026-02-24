const companyRepo = require('../../infrastructure/repositories/CompanyRepository');
const materialRepo = require('../../infrastructure/repositories/MaterialRepository');

/**
 * CompanyController
 * Handles IPC communication for Multi-Company price management and settings.
 */
class CompanyController {
    static register(handle) {
        handle('get-all-empresas', () => companyRepo.getAll());
        handle('get-empresa', (_, id) => companyRepo.getById(id));
        handle('create-empresa', (_, data) => companyRepo.create(data.nome, data.contrato, data.regional));
        handle('update-empresa', (_, data) => companyRepo.update(data.id, data.nome, data.contrato, data.regional));
        handle('delete-empresa', (_, id) => companyRepo.delete(id));

        handle('get-empresa-ativa', () => companyRepo.getAtiva());
        handle('set-empresa-ativa', (_, id) => companyRepo.setAtiva(id));

        // Company Prices
        handle('get-preco-by-empresa', (_, { empresaId, sap }) => materialRepo.getPrecoByEmpresa(empresaId, sap));
        handle('get-all-precos-by-empresa', (_, id) => materialRepo.getAllPrecosByEmpresa(id));
        handle('set-preco-empresa', (_, { empresaId, sap, precoNovo, origem }) => materialRepo.setPrecoEmpresa(empresaId, sap, precoNovo, origem));
        handle('import-precos-from-array', (_, { empresaId, precosArray, origem }) => materialRepo.importPrecosFromArray(empresaId, precosArray, origem));
        handle('reajuste-em-massa', (_, { empresaId, percentual, filtroSaps }) => materialRepo.reajusteEmMassa(empresaId, percentual, filtroSaps));
        handle('get-historico-precos', (_, { empresaId, limit }) => materialRepo.getHistoricoPrecos(empresaId, limit));
    }
}

module.exports = CompanyController;
