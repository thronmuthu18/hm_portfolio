const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const contactController = require('../../controllers/contactController');
const { contactValidationRules, validate } = require('../../middleware/validator');

// Stricter rate limiter specifically for contact form submissions (prevent spamming inbox/database)
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 5, // Limit each IP to 5 submissions per window
  message: {
    success: false,
    message: 'Too many contact enquiries from this IP. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const { visitorTracker } = require('../../middleware/admin/visitorTracker');

// Route definition: POST /api/v1/contact
router.post('/', contactLimiter, contactValidationRules, validate, visitorTracker, contactController.submitContact);

module.exports = router;
