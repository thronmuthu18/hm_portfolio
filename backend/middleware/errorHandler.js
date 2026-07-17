const ApiError = require('../utils/apiError');

/**
 * Standardized Global Error Handler Middleware
 * Unified JSON response format conforming to REST specifications
 */
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  
  const responsePayload = {
    success: false,
    message: err.message || 'Something went wrong on the server.'
  };

  // Development Mode: Append stack trace and technical properties for local debugging
  if (process.env.NODE_ENV === 'development') {
    return res.status(err.statusCode).json({
      ...responsePayload,
      error: err,
      stack: err.stack
    });
  }

  // Production Mode: Limit technical exposure
  if (err.isOperational) {
    // Trustworthy operational exceptions (validation failures, rate limits, CORS blocks)
    return res.status(err.statusCode).json(responsePayload);
  }

  // Unknown systems exceptions (DB disconnects, syntax bugs): Mask details safely
  const logger = require('../utils/logger');
  logger.server('SYSTEM_EXCEPTION', err.message, { stack: err.stack });
  
  console.error('SYSTEM ERROR 💥:', err);
  return res.status(500).json({
    success: false,
    message: 'An unexpected internal server error occurred.'
  });
};
