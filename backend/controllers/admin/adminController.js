const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const os = require('os');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');


// Models
const Contact = require('../../models/Contact');
const ContactCrmMeta = require('../../models/admin/ContactCrmMeta');
const AdminSession = require('../../models/admin/AdminSession');
const AdminLockout = require('../../models/admin/AdminLockout');
const AdminAuthLog = require('../../models/admin/AdminAuthLog');

// Services
const databaseService = require('../../services/admin/databaseService');
const visitorService = require('../../services/admin/visitorService');
const activityService = require('../../services/admin/activityService');
const analyticsService = require('../../services/admin/analyticsService');
const reportService = require('../../services/admin/reportService');
const emailService = require('../../services/emailService');
const logger = require('../../utils/logger');

// Lockout configurations
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_EXPIRY_MULTIPLIER = {
  1: 5 * 60 * 1000,   // 5 minutes
  2: 15 * 60 * 1000,  // 15 minutes
  3: 60 * 60 * 1000   // 1 hour
};

// User-Agent parser helper
const parseUA = (ua) => {
  if (!ua) return { browser: 'Unknown', os: 'Unknown', device: 'Desktop' };
  
  let os = 'Unknown';
  if (/Windows/i.test(ua)) os = 'Windows';
  else if (/Macintosh|Mac OS X/i.test(ua)) os = 'macOS';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';
  else if (/Linux/i.test(ua)) os = 'Linux';

  let browser = 'Unknown';
  if (/Edg/i.test(ua)) browser = 'Edge';
  else if (/Chrome/i.test(ua)) browser = 'Chrome';
  else if (/Firefox/i.test(ua)) browser = 'Firefox';
  else if (/Safari/i.test(ua)) browser = 'Safari';

  let device = 'Desktop';
  if (/Mobi|Android|iPhone/i.test(ua)) device = 'Mobile';
  else if (/iPad|Tablet/i.test(ua)) device = 'Tablet';

  return { browser, os, device };
};

const adminController = {
  // ── AUTHENTICATION ──────────────────────────────────────────────────────────

  /**
   * POST /api/v1/admin/login
   * Enterprise admin authentication with rate-limiting lockouts, RTR refresh, and active logs
   */
  login: async (req, res, next) => {
    const { username, password, rememberMe } = req.body;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const parsedUa = parseUA(userAgent);

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required.' });
    }

    try {
      // 1. Check Brute-Force lockout status
      const lockout = await AdminLockout.findOne({ ip, username });

      if (lockout && lockout.lockUntil && lockout.lockUntil > new Date()) {
        const remainingMs = lockout.lockUntil - new Date();
        const mins = Math.ceil(remainingMs / 60000);
        
        logger.auth('BruteForce', `Blocked login attempt for: ${username} from IP: ${ip}. Locked for another ${mins} mins.`);
        
        return res.status(429).json({
          success: false,
          message: `Account is temporarily locked. Try again in ${mins} minutes.`
        });
      }

      // 2. Validate Credentials
      const adminUsername = process.env.ADMIN_USERNAME;
      const adminPasswordHash = process.env.ADMIN_PASSWORD;

      let passwordMatch = false;
      if (username === adminUsername) {
        if (adminPasswordHash && adminPasswordHash.startsWith('$2')) {
          // bcrypt hash — use bcrypt.compare (timing-safe by design)
          passwordMatch = await bcrypt.compare(password, adminPasswordHash);
        } else if (adminPasswordHash) {
          // Plain-text fallback: use constant-time comparison to prevent timing attacks
          const aLen = Buffer.byteLength(adminPasswordHash);
          const bLen = Buffer.byteLength(password);
          if (aLen === bLen) {
            passwordMatch = crypto.timingSafeEqual(
              Buffer.from(adminPasswordHash),
              Buffer.from(password)
            );
          }
        }
      }

      if (!passwordMatch) {
        // Increment failed attempts
        let attempts = 1;
        let lockUntil = null;
        let lockoutCount = 0;

        if (lockout) {
          attempts = lockout.failedAttempts + 1;
          lockoutCount = lockout.lockoutCount;
          
          if (attempts >= MAX_FAILED_ATTEMPTS) {
            lockoutCount = Math.min(3, lockoutCount + 1);
            lockUntil = new Date(Date.now() + LOCKOUT_EXPIRY_MULTIPLIER[lockoutCount]);
            attempts = 0; // reset counter after locking
          }
          
          await AdminLockout.updateOne(
            { ip, username },
            { $set: { failedAttempts: attempts, lockUntil, lockoutCount } }
          );
        } else {
          await AdminLockout.create({
            ip,
            username,
            failedAttempts: attempts
          });
        }

        // Log failed attempt
        await AdminAuthLog.create({
          username,
          ip,
          userAgent,
          browser: parsedUa.browser,
          os: parsedUa.os,
          device: parsedUa.device,
          success: false,
          reason: 'Invalid credentials.'
        });
        logger.auth('AuthFailure', `Failed login attempt for: ${username} from IP: ${ip}`);

        return res.status(401).json({ success: false, message: 'Invalid credentials.' });
      }

      // Successful login - clear lockout counters
      if (lockout) {
        await AdminLockout.deleteOne({ ip, username });
      }

      // Generate Access Token (15 mins) — HS256 algorithm explicitly enforced
      const token = jwt.sign(
        { username, role: 'admin' },
        process.env.JWT_SECRET,
        { expiresIn: '15m', algorithm: 'HS256' }
      );

      // Generate Refresh Token (7 days) — HS256 algorithm explicitly enforced
      const familyId = crypto.randomUUID();
      const refreshToken = jwt.sign(
        { username, role: 'admin', familyId },
        process.env.JWT_SECRET,
        { expiresIn: '7d', algorithm: 'HS256' }
      );

      const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      const sessionExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      
      // Single Active Session enforcement
      if (process.env.SINGLE_ACTIVE_SESSION === 'true') {
        await AdminSession.deleteMany({ adminUsername: username });
      }

      await AdminSession.create({
        tokenHash,
        adminUsername: username,
        familyId,
        ip,
        userAgent,
        browser: parsedUa.browser,
        os: parsedUa.os,
        device: parsedUa.device,
        expiresAt: sessionExpiry
      });

      // Set Refresh Token HTTP-only cookie
      res.cookie('admin_refresh', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        expires: sessionExpiry
      });

      // Set access token cookie helper
      res.cookie('admin_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 15 * 60 * 1000
      });

      // Log success
      await AdminAuthLog.create({
        username,
        ip,
        userAgent,
        browser: parsedUa.browser,
        os: parsedUa.os,
        device: parsedUa.device,
        success: true
      });
      await activityService.log(username, 'LOGIN', null, 'Admin signed in successfully.', req);

      res.status(200).json({
        success: true,
        message: 'Login successful.',
        token
      });

    } catch (err) {
      logger.server('AdminController', 'Login execution crash', err);
      res.status(500).json({ success: false, message: 'Authentication failed.' });
    }
  },

  /**
   * POST /api/v1/admin/refresh-token
   * Silent automatic Refresh Token Rotation (RTR)
   */
  refreshToken: async (req, res, next) => {
    const refreshToken = req.cookies.admin_refresh;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const parsedUa = parseUA(userAgent);

    if (!refreshToken) {
      return res.status(401).json({ success: false, message: 'Refresh token cookie missing.' });
    }

    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET, { algorithms: ['HS256'] });
      const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

      // Find active token in database
      const activeSession = await AdminSession.findOne({ tokenHash });

      if (!activeSession) {
        // Double check if this token was already rotated (RTR breach detection)
        const reuseSession = await AdminSession.findOne({
          familyId: decoded.familyId,
          rotated: true
        });

        if (reuseSession) {
          // Breach occurred! Revoke entire session tree
          await AdminSession.deleteMany({ familyId: decoded.familyId });
          res.clearCookie('admin_refresh', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
          });
          res.clearCookie('admin_token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
          });
          
          logger.auth('RTR_Breach', `Token reuse breach detected on IP: ${ip}. Invalidating familyId: ${decoded.familyId}`);
          return res.status(401).json({ success: false, message: 'Breach detected: Session terminated.' });
        }

        return res.status(401).json({ success: false, message: 'Invalid session context.' });
      }

      // Check if session has already rotated (safety fallback)
      if (activeSession.rotated) {
        await AdminSession.deleteMany({ familyId: activeSession.familyId });
        res.clearCookie('admin_refresh', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
        });
        res.clearCookie('admin_token', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
        });
        return res.status(401).json({ success: false, message: 'Breach detected: Token already rotated.' });
      }

      // Mark current session as rotated
      activeSession.rotated = true;
      await activeSession.save();

      // Rotate Refresh Token — HS256 algorithm explicitly enforced
      const newRefreshToken = jwt.sign(
        { username: decoded.username, role: 'admin', familyId: activeSession.familyId },
        process.env.JWT_SECRET,
        { expiresIn: '7d', algorithm: 'HS256' }
      );

      const newAccessToken = jwt.sign(
        { username: decoded.username, role: 'admin' },
        process.env.JWT_SECRET,
        { expiresIn: '15m', algorithm: 'HS256' }
      );

      const newHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');
      const sessionExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      // Create new session document for the next request
      await AdminSession.create({
        tokenHash: newHash,
        adminUsername: decoded.username,
        familyId: activeSession.familyId,
        ip,
        userAgent,
        browser: parsedUa.browser,
        os: parsedUa.os,
        device: parsedUa.device,
        expiresAt: sessionExpiry
      });

      // Clear/Replace Cookies
      res.cookie('admin_refresh', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        expires: sessionExpiry
      });

      res.cookie('admin_token', newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 15 * 60 * 1000
      });

      res.status(200).json({
        success: true,
        token: newAccessToken
      });

    } catch (err) {
      logger.server('AdminController', 'Session rotation failed', err);
      res.status(401).json({ success: false, message: 'Failed to rotate authentication session.' });
    }
  },

  /**
   * POST /api/v1/admin/logout
   */
  logout: async (req, res) => {
    const refreshToken = req.cookies.admin_refresh;
    if (refreshToken) {
      const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      await AdminSession.deleteOne({ tokenHash: hash });
    }
    
    res.clearCookie('admin_refresh', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    });
    res.clearCookie('admin_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    });
    
    if (req.admin) {
      await activityService.log(req.admin.username, 'LOGOUT', null, 'Admin logged out.', req);
    }

    res.status(200).json({ success: true, message: 'Logged out successfully.' });
  },

  /**
   * POST /api/v1/admin/logout-all
   */
  logoutAll: async (req, res) => {
    try {
      await AdminSession.deleteMany({ adminUsername: req.admin.username });
      res.clearCookie('admin_refresh', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
      });
      res.clearCookie('admin_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
      });
      
      await activityService.log(req.admin.username, 'LOGOUT_ALL', null, 'Logged out from all active sessions.', req);
      
      res.status(200).json({ success: true, message: 'Logged out from all sessions.' });
    } catch (_) {
      res.status(500).json({ success: false, message: 'Failed to clear active sessions.' });
    }
  },

  /**
   * GET /api/v1/admin/profile
   */
  getProfile: (req, res) => {
    res.status(200).json({
      success: true,
      data: { username: req.admin.username, role: req.admin.role }
    });
  },

  /**
   * POST /api/v1/admin/settings/password
   */
  changePassword: async (req, res, next) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new password are required.' });
    }

    // Enforce strong password policy: min 8 chars, uppercase, digit, special character
    const strongPasswordRegex = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    if (!strongPasswordRegex.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters and include an uppercase letter, a number, and a special character.'
      });
    }

    try {
      const adminPasswordHash = process.env.ADMIN_PASSWORD;
      let passwordMatch = false;

      if (adminPasswordHash && adminPasswordHash.startsWith('$2')) {
        passwordMatch = await bcrypt.compare(currentPassword, adminPasswordHash);
      } else if (adminPasswordHash) {
        // Timing-safe comparison to prevent timing attacks on plaintext passwords
        const aLen = Buffer.byteLength(adminPasswordHash);
        const bLen = Buffer.byteLength(currentPassword);
        if (aLen === bLen) {
          passwordMatch = crypto.timingSafeEqual(
            Buffer.from(adminPasswordHash),
            Buffer.from(currentPassword)
          );
        }
      }

      if (!passwordMatch) {
        return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
      }

      const newHash = await bcrypt.hash(newPassword, 12);
      // Update in-memory env; note: to persist across restarts, update ADMIN_PASSWORD in your deployment environment
      process.env.ADMIN_PASSWORD = newHash;

      await activityService.log(req.admin.username, 'PASSWORD_CHANGE', null, 'Admin security password changed.', req);

      res.status(200).json({
        success: true,
        message: 'Password changed successfully. Update your deployment environment variable ADMIN_PASSWORD to persist this change across restarts.'
      });
    } catch (err) {
      logger.server('AdminController', 'Password change failed', err);
      res.status(500).json({ success: false, message: 'Failed to change admin password.' });
    }
  },

  // ── DIAGNOSTICS & CRM INBOX OPERATIONS ──────────────────────────────────────

  /**
   * GET /api/v1/admin/status (alias /health)
   */
  getStatus: async (req, res) => {
    try {
      const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
      const smtpStatus = process.env.EMAIL_USER && process.env.EMAIL_PASS ? 'configured' : 'offline';
      
      let diskUsage = 'Normal';
      try {
        const root = process.platform === 'win32' ? 'C:' : '/';
        const stats = fs.statSync(root);
      } catch (_) {}

      const cpus = os.cpus();
      const load = os.loadavg();
      const cpuUsage = `${Math.round((load[0] / cpus.length) * 100)}%`;

      const health = {
        server: 'online',
        database: dbStatus,
        smtp: smtpStatus,
        api: 'healthy',
        memoryUsage: {
          rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB`,
          heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)} MB`,
          heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`
        },
        cpuUsage,
        diskUsage,
        uptime: Math.round(process.uptime()),
        environment: process.env.NODE_ENV || 'development'
      };

      res.status(200).json({ success: true, data: health });
    } catch (err) {
      logger.server('AdminController', 'Diagnostics read crashed', err);
      res.status(500).json({ success: false, message: 'Failed to read diagnostics.' });
    }
  },

  /**
   * GET /api/v1/admin/messages
   */
  getMessages: async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sort = req.query.sort || 'newest';
    const filter = req.query.filter || 'all';
    const searchVal = (req.query.search || '').trim();

    try {
      const skipVal = (page - 1) * limit;

      const query = {};
      const crmMetaQuery = {};

      if (filter === 'deleted') {
        crmMetaQuery['isDeleted'] = true;
      } else {
        crmMetaQuery['isDeleted'] = { $ne: true };
      }

      if (filter === 'unread') {
        crmMetaQuery['status'] = 'unread';
      } else if (filter === 'read') {
        crmMetaQuery['status'] = 'read';
      } else if (filter === 'in-progress') {
        crmMetaQuery['status'] = 'in-progress';
      } else if (filter === 'completed') {
        crmMetaQuery['status'] = 'completed';
      } else if (filter === 'starred') {
        crmMetaQuery['starred'] = true;
      } else if (filter === 'archived') {
        crmMetaQuery['isArchived'] = true;
      } else {
        if (filter !== 'deleted') {
          crmMetaQuery['isArchived'] = { $ne: true };
        }
      }

      const now = new Date();
      if (filter === 'today') {
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        query['createdAt'] = { $gte: today };
      } else if (filter === 'yesterday') {
        const yesterdayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        const yesterdayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        query['createdAt'] = { $gte: yesterdayStart, $lt: yesterdayEnd };
      } else if (filter === 'week') {
        query['createdAt'] = { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
      } else if (filter === 'month') {
        query['createdAt'] = { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
      }

      if (searchVal) {
        const searchRegex = new RegExp(searchVal, 'i');
        query['$or'] = [
          { fullName: searchRegex },
          { email: searchRegex },
          { phone: searchRegex },
          { projectDescription: searchRegex },
          { projectType: searchRegex },
          { budget: searchRegex }
        ];
      }

      const results = await Contact.aggregate([
        { $match: query },
        {
          $lookup: {
            from: 'contactcrmmetas',
            localField: '_id',
            foreignField: 'contactId',
            as: 'crm'
          }
        },
        { $unwind: '$crm' },
        { $match: crmMetaQuery },
        // Project only table-view fields — strip embedded arrays (notes, tasks, attachments)
        // that are only needed in the detail drawer view. Dramatically reduces payload size.
        {
          $project: {
            fullName: 1,
            email: 1,
            phone: 1,
            projectType: 1,
            budget: 1,
            projectDescription: 1,
            createdAt: 1,
            updatedAt: 1,
            'crm._id': 1,
            'crm.contactId': 1,
            'crm.status': 1,
            'crm.starred': 1,
            'crm.isArchived': 1,
            'crm.isDeleted': 1,
            'crm.followUpDate': 1,
            'crm.followUpNote': 1,
            'crm.priority': 1,
            'crm.tags': 1,
            'crm.visitor': 1,
            'crm.crmScore': 1,
            'crm.updatedAt': 1
          }
        },
        {
          $sort: sort === 'oldest' ? { createdAt: 1 } :
                sort === 'alphabetical' ? { fullName: 1 } :
                sort === 'budget-high' ? { budget: -1 } :
                sort === 'budget-low' ? { budget: 1 } :
                { createdAt: -1 }
        },
        {
          $facet: {
            metadata: [{ $count: 'total' }],
            data: [{ $skip: skipVal }, { $limit: limit }]
          }
        }
      ]);

      const totalDocs = results[0].metadata[0] ? results[0].metadata[0].total : 0;
      const totalPages = Math.ceil(totalDocs / limit);
      const data = results[0].data;

      res.status(200).json({
        success: true,
        data,
        pagination: {
          total: totalDocs,
          totalPages,
          page,
          limit,
          hasNext: page < totalPages,
          hasPrevious: page > 1
        }
      });
    } catch (err) {
      logger.server('AdminController', 'Aggregated inbox query failed', err);
      res.status(500).json({ success: false, message: 'Server aggregation failed.' });
    }
  },

  /**
   * GET /api/v1/admin/messages/:id
   */
  getMessageDetail: async (req, res) => {
    try {
      const msg = await Contact.findById(req.params.id).lean();
      if (!msg) {
        return res.status(404).json({ success: false, message: 'Inquiry not found.' });
      }

      const crm = await ContactCrmMeta.findOne({ contactId: req.params.id }).lean();
      res.status(200).json({ success: true, data: { ...msg, crm } });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Detail retrieval failed.' });
    }
  },

  /**
   * PATCH /api/v1/admin/messages/:id/crm
   */
  updateCrmMeta: async (req, res) => {
    const contactId = req.params.id;
    const updates = req.body;

    try {
      const meta = await ContactCrmMeta.findOne({ contactId });
      if (!meta) {
        return res.status(404).json({ success: false, message: 'CRM metadata document missing.' });
      }

      const prev = meta.toObject();

      if (updates.status !== undefined) {
        meta.status = updates.status;
        meta.statusHistory.push({ status: updates.status, updatedAt: new Date(), changedBy: req.admin.username });
      }
      if (updates.starred !== undefined) meta.starred = updates.starred;
      if (updates.notes !== undefined) meta.notes = updates.notes;
      if (updates.tags !== undefined) meta.tags = updates.tags;
      
      if (updates.isArchived !== undefined) {
        meta.isArchived = updates.isArchived;
        meta.archivedAt = updates.isArchived ? new Date() : null;
      }
      
      if (updates.isDeleted !== undefined) {
        meta.isDeleted = updates.isDeleted;
        meta.deletedAt = updates.isDeleted ? new Date() : null;
        meta.deletedBy = updates.isDeleted ? req.admin.username : null;
      }

      if (updates.followUpDate !== undefined) meta.followUpDate = updates.followUpDate;
      if (updates.followUpPriority !== undefined) meta.followUpPriority = updates.followUpPriority;
      if (updates.followUpStatus !== undefined) meta.followUpStatus = updates.followUpStatus;

      await meta.save();

      await activityService.auditChange(
        req.admin.username,
        'CRM_META_UPDATE',
        contactId,
        prev,
        meta.toObject(),
        req
      );

      analyticsService.invalidateCache();

      res.status(200).json({ success: true, data: meta });
    } catch (err) {
      logger.server('AdminController', 'Updating CRM metadata parameters failed', err);
      res.status(500).json({ success: false, message: 'CRM update failed.' });
    }
  },

  /**
   * GET /api/v1/admin/analytics
   */
  getAnalytics: async (req, res) => {
    try {
      const data = await analyticsService.getCachedAnalytics();
      res.status(200).json({ success: true, data });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Analytics aggregation failed.' });
    }
  },

  /**
   * POST /api/v1/admin/messages/bulk
   */
  applyBulkAction: async (req, res) => {
    const { ids, action, value } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid query selections.' });
    }

    try {
      const updateFields = {};
      if (action === 'status') {
        updateFields['status'] = value;
      } else if (action === 'archive') {
        updateFields['isArchived'] = value;
        updateFields['archivedAt'] = value ? new Date() : null;
      } else if (action === 'star') {
        updateFields['starred'] = value;
      } else if (action === 'delete') {
        updateFields['isDeleted'] = value;
        updateFields['deletedAt'] = value ? new Date() : null;
        updateFields['deletedBy'] = value ? req.admin.username : null;
      }

      // Enforce status history for bulk status updates
      if (action === 'status') {
        for (const targetId of ids) {
          await ContactCrmMeta.updateOne(
            { contactId: targetId },
            { 
              $set: { status: value },
              $push: { statusHistory: { status: value, updatedAt: new Date(), changedBy: req.admin.username } }
            }
          );
        }
      } else {
        await ContactCrmMeta.updateMany(
          { contactId: { $in: ids } },
          { $set: updateFields }
        );
      }

      await activityService.log(
        req.admin.username,
        `BULK_${action.toUpperCase()}`,
        null,
        `Applied bulk ${action} action to ${ids.length} contacts.`,
        req
      );

      analyticsService.invalidateCache();
      res.status(200).json({ success: true, message: 'Bulk action applied successfully.' });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Bulk operation failed.' });
    }
  },

  // ── CRM ENTERPRISE TABULAR ACTIONS ─────────────────────────────────────────
  addInternalNote: async (req, res) => {
    const contactId = req.params.id;
    const { content } = req.body;
    if (!content) return res.status(400).json({ success: false, message: 'Note content is empty.' });

    try {
      const meta = await ContactCrmMeta.findOne({ contactId });
      if (!meta) return res.status(404).json({ success: false, message: 'CRM record missing.' });

      meta.internalNotes.push({
        author: req.admin.username,
        content,
        createdAt: new Date()
      });
      await meta.save();

      await activityService.log(req.admin.username, 'ADD_INTERNAL_NOTE', contactId, 'Added admin internal note.', req);
      res.status(200).json({ success: true, data: meta.internalNotes });
    } catch (_) {
      res.status(500).json({ success: false, message: 'Failed to add internal note.' });
    }
  },

  addTask: async (req, res) => {
    const contactId = req.params.id;
    const { title, deadline, priority } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'Task title is required.' });

    try {
      const meta = await ContactCrmMeta.findOne({ contactId });
      if (!meta) return res.status(404).json({ success: false, message: 'CRM record missing.' });

      meta.tasks.push({
        title,
        deadline: deadline ? new Date(deadline) : null,
        priority: priority || 'medium',
        completed: false
      });
      await meta.save();

      await activityService.log(req.admin.username, 'ADD_TASK', contactId, `Added client workspace task: ${title}`, req);
      res.status(200).json({ success: true, data: meta.tasks });
    } catch (_) {
      res.status(500).json({ success: false, message: 'Failed to add task.' });
    }
  },

  toggleTask: async (req, res) => {
    const { id, taskId } = req.params;
    try {
      const meta = await ContactCrmMeta.findOne({ contactId: id });
      if (!meta) return res.status(404).json({ success: false, message: 'CRM record missing.' });

      const task = meta.tasks.id(taskId);
      if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

      task.completed = !task.completed;
      await meta.save();

      await activityService.log(req.admin.username, 'TOGGLE_TASK', id, `Toggled task state: ${task.title}`, req);
      res.status(200).json({ success: true, data: meta.tasks });
    } catch (_) {
      res.status(500).json({ success: false, message: 'Failed to toggle task state.' });
    }
  },

  addAttachment: async (req, res) => {
    const contactId = req.params.id;
    const { name, mimeType, size, data } = req.body;
    if (!name || !data) return res.status(400).json({ success: false, message: 'Attachment file name and payload required.' });

    try {
      const meta = await ContactCrmMeta.findOne({ contactId });
      if (!meta) return res.status(404).json({ success: false, message: 'CRM record missing.' });

      meta.attachments.push({
        name,
        mimeType,
        size,
        data,
        uploadedAt: new Date()
      });
      await meta.save();

      await activityService.log(req.admin.username, 'ADD_ATTACHMENT', contactId, `Uploaded client file attachment: ${name}`, req);
      res.status(200).json({ success: true, data: meta.attachments });
    } catch (_) {
      res.status(500).json({ success: false, message: 'Failed to save base64 attachment.' });
    }
  },

  sendQuickEmail: async (req, res) => {
    const contactId = req.params.id;
    const { subject, body } = req.body;
    if (!subject || !body) return res.status(400).json({ success: false, message: 'Email subject and message body required.' });

    try {
      const contact = await Contact.findById(contactId);
      const meta = await ContactCrmMeta.findOne({ contactId });
      if (!contact || !meta) return res.status(404).json({ success: false, message: 'Client profile not found.' });

      // Delegate direct dispatching task to emailService
      await emailService.sendDirectEmail({
        to: contact.email,
        subject,
        body
      });

      // Log to client email history
      meta.emailHistory.push({
        subject,
        body,
        sentAt: new Date(),
        status: 'sent'
      });
      await meta.save();

      await activityService.log(req.admin.username, 'SEND_CLIENT_EMAIL', contactId, `Sent template reply email to: ${contact.email}`, req);
      res.status(200).json({ success: true, data: meta.emailHistory });
    } catch (err) {
      logger.server('AdminController', 'Email send crashed', err);
      res.status(500).json({ success: false, message: `Failed to dispatch email: ${err.message}` });
    }
  },

  getClientTimeline: async (req, res) => {
    const contactId = req.params.id;
    try {
      // Find audit logs matching this contactId from the DB
      const logs = await mongoose.connection.db.collection('adminactivitylogs')
        .find({ targetId: contactId })
        .sort({ createdAt: -1 })
        .toArray();

      res.status(200).json({ success: true, data: logs });
    } catch (_) {
      res.status(500).json({ success: false, message: 'Failed to compile audit timeline.' });
    }
  },

  // ── BACKUP ENDPOINTS ────────────────────────────────────────────────────────
  backupDatabase: async (req, res) => {
    try {
      const backup = await databaseService.createBackup();
      await activityService.log(req.admin.username, 'DB_BACKUP', null, `Created manual JSON database backup: ${backup.filename}`, req);
      res.status(200).json({ success: true, data: backup });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Backup creation failed.' });
    }
  },

  restoreDatabase: async (req, res) => {
    const { filename } = req.body;
    if (!filename) {
      return res.status(400).json({ success: false, message: 'Backup filename required.' });
    }

    try {
      const restore = await databaseService.restoreBackup(filename);
      await activityService.log(req.admin.username, 'DB_RESTORE', null, `Restored database state from backup: ${filename}`, req);
      analyticsService.invalidateCache();
      res.status(200).json({ success: true, message: 'Database state restored.' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message || 'Database restore failed.' });
    }
  },

  listBackups: async (req, res) => {
    try {
      const list = databaseService.listBackups();
      res.status(200).json({ success: true, data: list });
    } catch (_) {
      res.status(500).json({ success: false, message: 'Failed to look up backups.' });
    }
  },

  // ── EXPORT ENDPOINT ─────────────────────────────────────────────────────────
  exportMessages: async (req, res) => {
    const { ids, format } = req.body;
    try {
      let query = {};
      if (Array.isArray(ids) && ids.length > 0) {
        query['_id'] = { $in: ids };
      }

      const rawContacts = await Contact.find(query).lean();
      const contactIds = rawContacts.map(c => c._id);
      const crmMetas = await ContactCrmMeta.find({ contactId: { $in: contactIds } }).lean();

      const messages = rawContacts.map(c => {
        const crm = crmMetas.find(meta => meta.contactId.toString() === c._id.toString()) || {};
        return { ...c, crm };
      });

      let fileData = '';
      let mimeType = 'text/plain';

      if (format === 'csv') {
        fileData = reportService.generateCSV(messages);
        mimeType = 'text/csv';
      } else if (format === 'excel') {
        fileData = reportService.generateExcel(messages);
        mimeType = 'application/vnd.ms-excel';
      } else {
        fileData = JSON.stringify(messages, null, 2);
        mimeType = 'application/json';
      }

      await activityService.log(req.admin.username, 'DB_EXPORT', null, `Exported ${messages.length} messages in ${format} format.`, req);

      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `attachment; filename=crm-export.${format === 'excel' ? 'xls' : format}`);
      res.status(200).send(fileData);
    } catch (err) {
      res.status(500).json({ success: false, message: 'Compilation of export file failed.' });
    }
  }
};

module.exports = adminController;
