const db = require('../../../db/database.cjs');

class AuditFlagRepository {
    getFlags(poleId = null) {
        if (poleId) {
            return db.all('SELECT * FROM audit_flags WHERE pole_id = ? ORDER BY created_at DESC', [poleId]);
        }
        return db.all('SELECT * FROM audit_flags ORDER BY created_at DESC');
    }

    addFlag(flagData) {
        const { pole_id, severity, message, created_by } = flagData;
        return db.run(`
            INSERT INTO audit_flags (pole_id, severity, message, created_by)
            VALUES (?, ?, ?, ?)
        `, [pole_id, severity, message, created_by || 'TechLead']);
    }

    updateStatus(id, status) {
        const resolvedAt = status === 'resolved' ? new Date().toISOString() : null;
        return db.run(`
            UPDATE audit_flags 
            SET status = ?, resolved_at = ?
            WHERE id = ?
        `, [status, resolvedAt, id]);
    }

    deleteFlag(id) {
        return db.run('DELETE FROM audit_flags WHERE id = ?', [id]);
    }

    getStats() {
        const total = db.get('SELECT COUNT(*) as count FROM audit_flags');
        const open = db.get("SELECT COUNT(*) as count FROM audit_flags WHERE status = 'open'");
        const resolved = db.get("SELECT COUNT(*) as count FROM audit_flags WHERE status = 'resolved'");
        return {
            total: total?.count || 0,
            open: open?.count || 0,
            resolved: resolved?.count || 0,
            debtRatio: total?.count > 0 ? (open?.count / total?.count) * 100 : 0
        };
    }
}

module.exports = new AuditFlagRepository();
