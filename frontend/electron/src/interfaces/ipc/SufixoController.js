const sufixoRepo = require('../../infrastructure/repositories/SufixoRepository');

/**
 * SufixoController
 * Handles IPC for dynamic material resolution logic.
 */
class SufixoController {
    static register(handle) {
        handle('resolver-sufixo', (_, data) => sufixoRepo.resolverSufixo(data.prefixo, data.tipoContexto, data.valorContexto));
        handle('upsert-sufixo', (_, data) => sufixoRepo.upsertSufixo(data.prefixo, data.tipoContexto, data.valorContexto, data.sufixo));
        handle('get-all-sufixos', () => sufixoRepo.getAll());
    }
}

module.exports = SufixoController;
