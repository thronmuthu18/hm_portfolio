const visitorService = require('../../services/admin/visitorService');

/**
 * Session tracking middleware
 * Parses user cookie identifiers globally on API routes without blocking response delivery
 */
const sessionTracker = (req, res, next) => {
  // Execute tracking asynchronously so request pipeline doesn't block
  visitorService.trackSession(req, res);
  next();
};

module.exports = sessionTracker;
