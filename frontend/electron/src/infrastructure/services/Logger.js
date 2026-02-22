const fs = require('fs');
const path = require('path');
const { app } = require('electron');

class Logger {
    constructor() {
        this.logDir = path.join(app.getPath('userData'), 'logs');
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
        this.logFile = path.join(this.logDir, `app_${new Date().toISOString().split('T')[0]}.log`);
    }

    formatMessage(level, message, context = '') {
        const timestamp = new Date().toISOString();
        const ctx = context ? ` [${context}]` : '';
        return `[${timestamp}] [${level}]${ctx}: ${typeof message === 'object' ? JSON.stringify(message) : message}\n`;
    }

    async _log(level, message, context) {
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
        if (process.env.DEBUG || !app.isPackaged) {
            return this._log('DEBUG', message, context);
        }
    }
}

module.exports = new Logger();
