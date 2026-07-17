// Models
const AdminActivityLog = require('../../models/admin/AdminActivityLog');
const logger = require('../../utils/logger');

const activityService = {
  /**
   * Log admin operations
   */
  log: async (username, action, targetId = null, details = '', req = null) => {
    let ip = 'Unknown';
    let userAgent = 'Unknown';
    
    if (req) {
      ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
      userAgent = req.headers['user-agent'] || 'Unknown';
    }

    try {
      await AdminActivityLog.create({
        adminUsername: username,
        action,
        targetId,
        details,
        ip,
        userAgent
      });
      
      // Also write to local activity.log file
      logger.activity('AdminActivity', `${username} executed: ${action} on target: ${targetId || 'none'}. Details: ${details}`);
    } catch (err) {
      logger.server('ActivityService', 'Failed to save admin activity log to DB', err);
    }
  },

  /**
   * Enterprise Audit log to record detailed value diffs
   */
  auditChange: async (username, action, targetId, prevValue, newValue, req = null) => {
    const details = `PREV: ${JSON.stringify(prevValue)} | NEW: ${JSON.stringify(newValue)}`;
    await activityService.log(username, action, targetId, details, req);
  }
};

module.exports = activityService;
