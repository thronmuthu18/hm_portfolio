/**
 * Custom Operational API Error Class
 * Used to define structural errors with status codes and details
 */
class ApiError extends Error {
  constructor(message, statusCode) {
    super(message);
    
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    
    // Operational error flag to separate code bugs from predictable user/system exceptions
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ApiError;
