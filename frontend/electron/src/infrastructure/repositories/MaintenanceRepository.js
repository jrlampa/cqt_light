const db = require('../../../db/database.cjs');

class MaintenanceRepository {
    /**
     * Schedule a new maintenance job.
     */
    schedule(jobData) {
        const { pole_id, priority, job_type, scheduled_date, notes } = jobData;
        return db.run(`
            INSERT INTO maintenance_jobs (pole_id, priority, job_type, scheduled_date, notes)
            VALUES (?, ?, ?, ?, ?)
        `, [pole_id, priority || 'medium', job_type, scheduled_date, notes]);
    }

    /**
     * Get all maintenance jobs.
     */
    getAll() {
        return db.all('SELECT * FROM maintenance_jobs ORDER BY scheduled_date ASC');
    }

    /**
     * Update job status.
     */
    updateStatus(id, status) {
        return db.run('UPDATE maintenance_jobs SET status = ? WHERE id = ?', [status, id]);
    }

    /**
     * Get jobs for a specific pole.
     */
    getByPole(poleId) {
        return db.all('SELECT * FROM maintenance_jobs WHERE pole_id = ?', [poleId]);
    }
}

module.exports = new MaintenanceRepository();
