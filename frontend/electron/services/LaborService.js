/**
 * LaborService
 * Estimates Man-Hours (HH) based on structure complexity.
 */
class LaborService {
    estimateLaborHours(structures) {
        if (!structures) return 0;

        return structures.reduce((total, s) => {
            const code = s.codigo_kit?.toUpperCase() || '';
            let hh = 1;

            if (code.startsWith('TR')) hh = 12;
            else if (code.startsWith('N')) hh = 4;
            else if (code.startsWith('M')) hh = 6;
            else if (code.startsWith('B')) hh = 2;
            else if (code.startsWith('PR') || code.startsWith('CH')) hh = 3;

            return total + hh;
        }, 0);
    }
}

module.exports = new LaborService();
