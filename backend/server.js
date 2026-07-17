/**
 * Master Express Server Entrypoint
 * Portfolio of Sudalaimuthu A - Full Stack Web Developer
 */

// Handle uncaught exceptions before loading other modules
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down server...', err.name, err.message);
  process.exit(1);
});

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const compression = require('compression');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');

// Load configurations
dotenv.config();

// Validate critical environment configurations
const envCheck = require('./config/envCheck');
envCheck();

const connectDB = require('./config/db');

// Connect to Database
connectDB();

// Verify and build database indexing programmatically
const databaseService = require('./services/admin/databaseService');
databaseService.ensureIndexes();

const ApiError = require('./utils/apiError');
const globalErrorHandler = require('./middleware/errorHandler');
const apiRouter = require('./routes');

const app = express();

// 1. TELEMETRY REQUEST LOGGER
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  // Production format logging for security audit compliance
  app.use(morgan('combined'));
}

// 2. GLOBAL SECURITY HEADERS (HELMET WITH CUSTOM CSP FOR DEV/PROD)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", "http://localhost:5000", "http://127.0.0.1:5000"]
    }
  }
}));

// Obscure server footprint & establish response headers
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// 2b. COOKIE PARSER (required for admin JWT httpOnly cookie)
app.use(cookieParser());

// 3. SECURE CORS CONFIGURATION
const allowedOrigins = [
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:5501',
  'http://127.0.0.1:5501',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
];

if (process.env.CLIENT_URL) {
  allowedOrigins.push(process.env.CLIENT_URL);
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin: mobile apps, curl, local file:// pages (Origin: null), Postman
    if (!origin || origin === 'null') return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new ApiError('Blocked by CORS policy: Request origin unauthorized.', 403));
    }
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}));

// 4. REQUEST RATE LIMITER (DDoS & Brute-Force Safeguard)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: process.env.NODE_ENV === 'development' ? 1000 : 100, // Max 1000 in dev, 100 in prod
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api', apiLimiter);

// 5. PARSERS & INPUT SANITIZERS
app.use(express.json({ limit: '3mb' })); // Max payload limit to prevent buffer overloads (supports Base64 CRM file attachments up to 2MB)
app.use(mongoSanitize()); // Prevent NoSQL Injection attacks by stripping invalid operator prefixes
app.use(hpp()); // Prevent HTTP Parameter Pollution attacks

// 6. RESPONSE OPTIMIZATIONS
app.use(compression()); // Enable Gzip compression to speed up transfer rates

// 6b. TRAFFIC ANALYTICS SESSION TRACKING
const sessionTracker = require('./middleware/admin/sessionTracker');
app.use(sessionTracker);

// 7. ROUTING
app.use('/api', apiRouter);

// Handle undefined routes (404 operational error)
app.all('*', (req, res, next) => {
  next(new ApiError(`Can't find ${req.originalUrl} on this server.`, 404));
});

// 4. GLOBAL ERROR HANDLER
app.use(globalErrorHandler);

// Start server listening loop
const port = process.env.PORT || 5000;
const server = app.listen(port, () => {
  console.log(`Server is running on port ${port} in ${process.env.NODE_ENV} mode.`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down server gracefully...', err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
