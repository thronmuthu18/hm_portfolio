const jwt = require('jsonwebtoken');
const ApiError = require('../../utils/apiError');
const logger = require('../../utils/logger');

/**
 * Admin JWT Authentication Middleware
 * Verifies short-lived access token passed via Cookie or Authorization header
 */
const adminAuth = (req, res, next) => {
  try {
    let token = req.cookies && req.cookies.admin_token;

    // Check Authorization Header if cookie not present (needed for API clients, file:// setups)
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new ApiError('Unauthorized: Please login to access dashboard.', 401));
    }

    // Verify token validity
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });

    if (!decoded || decoded.role !== 'admin') {
      logger.security('AdminAuth', 'Forbidden: Decoded role is not administrator.');
      return next(new ApiError('Forbidden: Access denied.', 403));
    }

    // Save decoded session in request object
    req.admin = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new ApiError('Session expired. Please rotate token.', 401));
    }
    logger.security('AdminAuth', 'Unauthorized: Invalid signature token.');
    return next(new ApiError('Unauthorized: Session signature invalid.', 401));
  }
};

module.exports = adminAuth;
