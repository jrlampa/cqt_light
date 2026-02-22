const db = require('../../../db/database.cjs');

class NormativeRepository {
    /**
     * Get normative references for a specific material SAP code.
     * @param {string} sap 
     */
    getBySap(sap) {
        return db.all('SELECT * FROM normas_referencia WHERE sap = ? ORDER BY data_indexacao DESC', [sap]);
    }

    /**
     * Search norms by keyword in context or source.
     * @param {string} query 
     */
    search(query) {
        return db.all(`
            SELECT * FROM normas_referencia 
            WHERE contexto LIKE ? OR fonte LIKE ?
            ORDER BY data_indexacao DESC LIMIT 50
        `, [`%${query}%`, `%${query}%`]);
    }

    /**
     * Get all norms as a summary.
     */
    getSummary() {
        return db.all(`
            SELECT sap, COUNT(*) as refs, GROUP_CONCAT(DISTINCT fonte) as fontes
            FROM normas_referencia
            GROUP BY sap
        `);
    }
}

module.exports = new NormativeRepository();
