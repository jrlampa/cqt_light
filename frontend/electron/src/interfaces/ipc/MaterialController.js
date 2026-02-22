const materialRepo = require('../../infrastructure/repositories/MaterialRepository');
const kitRepo = require('../../infrastructure/repositories/KitRepository');

class MaterialController {
    static register(handle) {
        handle('get-all-materials', () => materialRepo.getAll());
        handle('search-materials', (_, query) => materialRepo.search(query));
        handle('get-materials-prices', (_, codes) => materialRepo.getPrices(codes));
        handle('upsert-material', (_, m) => materialRepo.upsert(m));
    }
}

module.exports = MaterialController;
