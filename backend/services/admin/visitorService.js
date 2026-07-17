const crypto = require('crypto');

// Models
const CrmVisitor = require('../../models/admin/CrmVisitor');
const CrmSession = require('../../models/admin/CrmSession');

// Helper to parse User Agents (same robust parsing from visitorTracker)
const parseUA = (ua) => {
  if (!ua) return { browser: 'Unknown', os: 'Unknown', device: 'Desktop', platform: 'Unknown' };

  let os = 'Unknown';
  let platform = 'Unknown';
  if (/Windows/i.test(ua)) { os = 'Windows'; platform = 'Windows NT'; }
  else if (/Macintosh|Mac OS X/i.test(ua)) { os = 'macOS'; platform = 'macOS'; }
  else if (/Android/i.test(ua)) { os = 'Android'; platform = 'Android OS'; }
  else if (/iPhone|iPad|iPod/i.test(ua)) { os = 'iOS'; platform = 'iOS'; }
  else if (/Linux/i.test(ua)) { os = 'Linux'; platform = 'Linux Kern'; }

  let browser = 'Unknown';
  if (/Edg/i.test(ua)) browser = 'Edge';
  else if (/Chrome/i.test(ua)) browser = 'Chrome';
  else if (/Firefox/i.test(ua)) browser = 'Firefox';
  else if (/Safari/i.test(ua)) browser = 'Safari';

  let device = 'Desktop';
  if (/Mobi|Android|iPhone/i.test(ua)) device = 'Mobile';
  else if (/iPad|Tablet/i.test(ua)) device = 'Tablet';

  return { browser, os, device, platform };
};

const visitorService = {
  /**
   * Session tracking handler middleware logic
   * Analyzes cookies and headers to record visitor parameters and session durations
   */
  trackSession: async (req, res) => {
    try {
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
      const ua = req.headers['user-agent'] || '';
      const parsedUa = parseUA(ua);
      const referrer = req.headers['referer'] || req.headers['referrer'] || 'Direct';
      const language = req.headers['accept-language'] ? req.headers['accept-language'].split(',')[0] : 'en';

      let visitorUid = req.cookies.crm_visitor_uid;
      let sessionUid = req.cookies.crm_session_uid;
      const now = new Date();

      // 1. Manage Visitor Cookie & Database Record
      let isReturning = false;
      if (!visitorUid) {
        visitorUid = crypto.randomUUID();
        // Set cookie for 1 year
        res.cookie('crm_visitor_uid', visitorUid, {
          httpOnly: true,
          expires: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000),
          sameSite: 'lax'
        });

        // Determine country (local mock fallback)
        let country = 'Unknown';
        if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.')) {
          country = 'Localhost (Dev)';
        }

        await CrmVisitor.create({
          visitorId: visitorUid,
          ip,
          country,
          language,
          browser: parsedUa.browser,
          os: parsedUa.os,
          device: parsedUa.device,
          platform: parsedUa.platform,
          isReturning: false
        });
      } else {
        isReturning = true;
        // Bump visit count
        await CrmVisitor.updateOne(
          { visitorId: visitorUid },
          { $set: { isReturning: true }, $inc: { visitCount: 1 } }
        );
      }

      // 2. Manage Session Cookie & Database Record
      if (!sessionUid) {
        sessionUid = crypto.randomUUID();
        res.cookie('crm_session_uid', sessionUid, { httpOnly: true, sameSite: 'lax' });

        await CrmSession.create({
          sessionId: sessionUid,
          visitorId: visitorUid,
          startTime: now,
          lastActivity: now,
          landingPage: req.originalUrl,
          pagesVisited: [req.originalUrl],
          referrer,
          bounce: true
        });
      } else {
        const session = await CrmSession.findOne({ sessionId: sessionUid });
        if (session) {
          session.lastActivity = now;
          session.duration = Math.floor((now - session.startTime) / 1000);

          if (!session.pagesVisited.includes(req.originalUrl)) {
            session.pagesVisited.push(req.originalUrl);
          }

          // Clear bounce if duration exceeds 10s or user visits > 1 page
          if (session.duration > 10 || session.pagesVisited.length > 1) {
            session.bounce = false;
          }

          await session.save();
        }
      }
    } catch (_) {
      // Fail silently to prevent crashing public route submissions
    }
  },

  /**
   * Aggregate traffic analytics totals
   */
  getTrafficStats: async () => {
    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [
      dailyVisitors,
      weeklyVisitors,
      monthlyVisitors,
      returningCount,
      totalCount,
      avgDuration,
      bounceRate
    ] = await Promise.all([
      CrmVisitor.countDocuments({ updatedAt: { $gte: last24Hours } }),
      CrmVisitor.countDocuments({ updatedAt: { $gte: last7Days } }),
      CrmVisitor.countDocuments({ updatedAt: { $gte: last30Days } }),
      CrmVisitor.countDocuments({ isReturning: true }),
      CrmVisitor.countDocuments({}),
      
      // Avg session duration
      CrmSession.aggregate([
        { $match: { startTime: { $gte: last30Days } } },
        { $group: { _id: null, avgDuration: { $avg: '$duration' } } }
      ]),

      // Bounce rates
      CrmSession.aggregate([
        { $match: { startTime: { $gte: last30Days } } },
        {
          $group: {
            _id: null,
            totalSessions: { $sum: 1 },
            bounces: { $sum: { $cond: [{ $eq: ['$bounce', true] }, 1, 0] } }
          }
        }
      ])
    ]);

    const averageDurationMins = avgDuration[0] ? (avgDuration[0].avgDuration / 60).toFixed(1) : 0;
    
    let bounceRatePercentage = 0;
    if (bounceRate[0] && bounceRate[0].totalSessions > 0) {
      bounceRatePercentage = Math.round((bounceRate[0].bounces / bounceRate[0].totalSessions) * 100);
    }

    return {
      dailyVisitors,
      weeklyVisitors,
      monthlyVisitors,
      returningRatio: totalCount > 0 ? Math.round((returningCount / totalCount) * 100) : 0,
      averageSessionMins: averageDurationMins,
      bounceRate: bounceRatePercentage
    };
  }
};

module.exports = visitorService;
