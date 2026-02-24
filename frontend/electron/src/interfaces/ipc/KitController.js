const kitRepo = require('../../infrastructure/repositories/KitRepository');

/**
 * KitController
 * Orchestrates Kit management and cost calculations.
 */
class KitController {
    static register(handle) {
        handle('get-all-kits', () => kitRepo.getAll());
        handle('search-kits', (_, query) => kitRepo.search(query));
        handle('get-kit', (_, code) => kitRepo.get(code));
        handle('get-kit-composition', (_, code) => kitRepo.getComposition(code));
        handle('upsert-kit', (_, data) => kitRepo.upsert(data));
        handle('delete-kit', (_, code) => kitRepo.delete(code));
        handle('get-custo-total', (_, kitCodes) => kitRepo.getCustoTotal(kitCodes));
        handle('add-material-to-kit', (_, data) => kitRepo.addMaterial(data.codigoKit, data.sap, data.quantidade));
    }
}

module.exports = KitController;
