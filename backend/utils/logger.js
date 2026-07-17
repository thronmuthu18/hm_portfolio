const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, '../logs');

// Ensure log directory exists
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

/**
 * Write structured message to file
 */
const writeLog = (filename, level, module, message, meta = null) => {
  const timestamp = new Date().toISOString();
  const metaStr = meta ? ` | Meta: ${JSON.stringify(meta)}` : '';
  const logLine = `[${timestamp}] [${level.toUpperCase()}] [${module.toUpperCase()}] ${message}${metaStr}\n`;
  
  const filePath = path.join(logDir, filename);
  fs.appendFile(filePath, logLine, (err) => {
    if (err) {
      console.error(`Failed to write log to ${filename}:`, err);
    }
  });
};

module.exports = {
  security: (module, message, meta) => writeLog('security.log', 'warn', module, message, meta),
  activity: (module, message, meta) => writeLog('activity.log', 'info', module, message, meta),
  server: (module, message, meta) => writeLog('server.log', 'error', module, message, meta),
  api: (module, message, meta) => writeLog('api.log', 'debug', module, message, meta),
  database: (module, message, meta) => writeLog('database.log', 'info', module, message, meta),
  auth: (module, message, meta) => writeLog('auth.log', 'info', module, message, meta)
};
