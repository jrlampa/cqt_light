const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

/**
 * DatabaseProvider
 * Lightweight wrapper for better-sqlite3 connection.
 * Focal point for all repository-driven SQL execution.
 */
class DatabaseProvider {
  constructor() {
    this.db = null;
    this.dbPath = path.join(process.cwd(), 'cqt_light.db');
    this.initialized = false;
  }

  init() {
    if (this.initialized && this.db) return;
    try {
      this.db = new Database(this.dbPath);
      this.db.pragma('journal_mode = WAL');
      this.db.pragma('synchronous = NORMAL');
      this.db.pragma('foreign_keys = ON');

      const schemaPath = path.join(__dirname, 'schema.sql');
      if (fs.existsSync(schemaPath)) {
        const schema = fs.readFileSync(schemaPath, 'utf-8');
        this.db.exec(schema);
      }
      this.initialized = true;
    } catch (err) {
      console.error('Database initialization error:', err);
    }
  }

  run(sql, params = []) {
    this.init();
    const info = this.db.prepare(sql).run(params);
    return { changes: info.changes, lastInsertRowid: info.lastInsertRowid };
  }

  get(sql, params = []) {
    this.init();
    return this.db.prepare(sql).get(params);
  }

  all(sql, params = []) {
    this.init();
    return this.db.prepare(sql).all(params);
  }

  exec(sql) {
    return this.db.exec(sql);
  }
}

module.exports = new DatabaseProvider();
