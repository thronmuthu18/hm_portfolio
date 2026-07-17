const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();

const adminController = require('../../controllers/admin/adminController');
const adminAuth = require('../../middleware/admin/adminAuth');

// Strict rate limiter for login endpoint only
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 100 : 10,
  message: { success: false, message: 'Too many login attempts. Please wait 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});

// ── PUBLIC ──────────────────────────────────────────────────────────────────
router.post('/login', loginLimiter, adminController.login);
router.post('/refresh-token', adminController.refreshToken);
router.post('/logout', adminController.logout);

// ── PROTECTED (require valid JWT token) ─────────────────────────────────────
router.use(adminAuth);

router.post('/logout-all', adminController.logoutAll);
router.get('/profile',  adminController.getProfile);
router.get('/status',   adminController.getStatus);
router.get('/health',   adminController.getStatus); // alias for system diagnostics

// Messages CRM
router.get('/messages',      adminController.getMessages);
router.get('/messages/:id',  adminController.getMessageDetail);
router.patch('/messages/:id/crm', adminController.updateCrmMeta);
router.post('/messages/bulk', adminController.applyBulkAction);
router.post('/messages/export', adminController.exportMessages);

// CRM tab extensions
router.post('/messages/:id/notes', adminController.addInternalNote);
router.post('/messages/:id/tasks', adminController.addTask);
router.patch('/messages/:id/tasks/:taskId', adminController.toggleTask);
router.post('/messages/:id/attachments', adminController.addAttachment);
router.post('/messages/:id/email', adminController.sendQuickEmail);
router.get('/messages/:id/timeline', adminController.getClientTimeline);

// Caching Aggregates
router.get('/analytics', adminController.getAnalytics);

// Database Administration (Backup/Restore)
router.post('/database/backup', adminController.backupDatabase);
router.post('/database/restore', adminController.restoreDatabase);
router.get('/database/backups', adminController.listBackups);

router.post('/settings/password', adminController.changePassword);

module.exports = router;
