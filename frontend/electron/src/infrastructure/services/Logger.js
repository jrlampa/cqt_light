const fs = require('fs');
const path = require('path');
const { app } = require('electron');

class Logger {
    constructor() {
        this.logDir = null;
        this.logFile = null;
    }

    _ensureLogDir() {
        if (this.logDir) return;
        try {
            // Use a safe fallback if app is not ready or available
            const userData = app.getPath ? app.getPath('userData') : process.cwd();
            this.logDir = path.join(userData, 'logs');
            if (!fs.existsSync(this.logDir)) {
                fs.mkdirSync(this.logDir, { recursive: true });
            }
            this.logFile = path.join(this.logDir, `app_${new Date().toISOString().split('T')[0]}.log`);
        } catch (e) {
            console.error('Logger: Failed to initialize log directory', e.message);
        }
    }

    formatMessage(level, message, context = '') {
        const timestamp = new Date().toISOString();
        const ctx = context ? ` [${context}]` : '';
        return `[${timestamp}] [${level}]${ctx}: ${typeof message === 'object' ? JSON.stringify(message) : message}\n`;
    }

    async _log(level, message, context) {
        this._ensureLogDir();
        const formatted = this.formatMessage(level, message, context);
        console.log(formatted.trim());
        try {
            await fs.promises.appendFile(this.logFile, formatted);
        } catch (err) {
            console.error('Failed to write to log file:', err);
        }
    }

    info(message, context = '') {
        return this._log('INFO', message, context);
    }

    warn(message, context = '') {
        return this._log('WARN', message, context);
    }

    error(message, context = '', error = null) {
        let msg = message;
        if (error) {
            msg = `${message} | Error: ${error.message}${error.stack ? ` | Stack: ${error.stack}` : ''}`;
        }
        return this._log('ERROR', msg, context);
    }

    debug(message, context = '') {
        if (process.env.DEBUG || !app?.isPackaged) {
            return this._log('DEBUG', message, context);
        }
    }
}

module.exports = new Logger();
