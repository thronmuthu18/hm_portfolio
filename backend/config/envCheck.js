/**
 * Environment Variable Checker
 * Validates that all required environment variables are configured correctly before server starts
 */
const dns = require('dns');

const validateEnv = () => {
  const required = [
    'MONGODB_URI',
    'EMAIL_USER',
    'EMAIL_PASS',
    'JWT_SECRET',
    'ADMIN_USERNAME',
    'ADMIN_PASSWORD',
    'CLIENT_URL',
    'PORT'
  ];

  const missing = [];
  
  required.forEach(key => {
    if (!process.env[key] || process.env[key].trim() === '') {
      missing.push(key);
    }
  });

  if (missing.length > 0) {
    console.error('\n💥 CRITICAL CONFIGURATION ERROR:');
    console.error('The following required environment variables are missing or empty:');
    missing.forEach(m => console.error(`  - ${m}`));
    console.error('\nPlease check your backend .env file and restart the server.\n');
    process.exit(1);
  }

  // Deep checks
  // 1. JWT_SECRET length
  if (process.env.NODE_ENV === 'production' && process.env.JWT_SECRET.length < 32) {
    console.warn('\n⚠️  SECURITY WARNING: JWT_SECRET should be at least 32 characters in production mode.');
  }

  // 2. Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(process.env.EMAIL_USER)) {
    console.error(`💥 CONFIGURATION ERROR: EMAIL_USER (${process.env.EMAIL_USER}) is not a valid email address.`);
    process.exit(1);
  }

  console.log('✅ Configuration validated: Environment variables OK.');
};

module.exports = validateEnv;
