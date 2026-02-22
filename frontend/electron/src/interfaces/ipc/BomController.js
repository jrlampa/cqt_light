const bomUseCase = require('../../application/GenerateBOMUseCase');

class BomController {
    static register(handle) {
        handle('generate-bom', async (_, projectData) => {
            return bomUseCase.execute(projectData);
        });
    }
}

module.exports = BomController;
