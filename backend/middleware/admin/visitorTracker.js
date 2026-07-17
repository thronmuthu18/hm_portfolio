const ContactCrmMeta = require('../../models/admin/ContactCrmMeta');
const logger = require('../../utils/logger');

// Simple regex parsers for User Agent to avoid external dependencies
const parseUserAgent = (ua) => {
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
  else if (/Trident|MSIE/i.test(ua)) browser = 'IE';

  let device = 'Desktop';
  if (/Mobi|Android|iPhone|iPod/i.test(ua)) {
    device = 'Mobile';
  } else if (/iPad|Tablet/i.test(ua)) {
    device = 'Tablet';
  }

  return { browser, os, device };
};

/**
 * Visitor Analytics Interceptor Middleware
 * Intercepts res.json on /api/v1/contact to bind visitor metadata with the saved enquiry ID
 */
const visitorTracker = (req, res, next) => {
  const originalJson = res.json;

  res.json = function (body) {
    // Only intercept successful contact creations (status 201)
    if (res.statusCode === 201 && body && body.success && body.data && body.data.id) {
      const contactId = body.data.id;
      
      const ua = req.headers['user-agent'];
      const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
      const referrer = req.headers['referer'] || req.headers['referrer'] || 'Direct';
      const language = req.headers['accept-language'] ? req.headers['accept-language'].split(',')[0] : 'Unknown';
      
      // Attempt timezone parsing or country parsing
      // For local development, map localhost IP to Local/India for realism
      let country = 'Unknown';
      if (clientIp === '127.0.0.1' || clientIp === '::1' || clientIp.startsWith('192.168.') || clientIp.startsWith('10.')) {
        country = 'Localhost (Dev)';
      } else {
        country = 'Remote User'; // In production, can fetch from GeoIP header (e.g. cloudflare/render headers)
      }

      const parsedUa = parseUserAgent(ua);
      const timezone = req.body.timezone || 'Asia/Kolkata';
      const screenSize = req.body.screenSize || 'Desktop';

      // Asynchronously create the CRM Metadata document
      ContactCrmMeta.create({
        contactId,
        status: 'unread',
        visitor: {
          country,
          browser: parsedUa.browser,
          os: parsedUa.os,
          device: parsedUa.device,
          screenSize,
          language,
          timezone,
          referrer
        }
      })
      .then(() => {
        logger.activity('VisitorTracker', `CRM Metadata initialized for inquiry ${contactId}`);
      })
      .catch((err) => {
        logger.server('VisitorTracker', `Failed to initialize CRM Metadata for ${contactId}`, err);
      });
    }

    // Call original res.json
    return originalJson.apply(this, arguments);
  };

  next();
};

module.exports = { visitorTracker, parseUserAgent };
