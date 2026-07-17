const { body, validationResult } = require('express-validator');

/**
 * Validation rules list for Contact Enquiry request payload
 */
exports.contactValidationRules = [
  // Full Name: Required, length [2, 80], sanitized
  body('fullName')
    .notEmpty()
    .withMessage('Full name is required.')
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage('Full name must be between 2 and 80 characters.')
    .escape(), // Escape HTML tags to prevent cross-site scripting (XSS)

  // Email: Required, valid format, lowercase normalized
  body('email')
    .notEmpty()
    .withMessage('Email address is required.')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address.')
    .normalizeEmail({ gmail_remove_dots: false }), // Standardize lowercase/canonical forms

  // Phone: Required, numeric/international regex format, length [7, 20]
  body('phone')
    .notEmpty()
    .withMessage('Phone number is required.')
    .trim()
    .matches(/^\+?[0-9\s\-()]{7,20}$/)
    .withMessage('Please provide a valid phone number (7 to 20 digits, spaces/hyphens allowed).'),

  // Project Type: Required, sanitised
  body('projectType')
    .notEmpty()
    .withMessage('Project type is required.')
    .trim()
    .escape(),

  // Budget: Required, sanitised
  body('budget')
    .notEmpty()
    .withMessage('Budget classification is required.')
    .trim()
    .escape(),

  // Project Description: Required, length [10, 2000], trimmed, sanitised
  body('projectDescription')
    .notEmpty()
    .withMessage('Project description is required.')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters.')
    .escape()
];

/**
 * Validation checker middleware
 * Analyzes validation result matrices. Returns 400 Bad Request if validation checks fail.
 */
exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  // Format array errors into structured object mapper
  const extractedErrors = [];
  errors.array().forEach(err => extractedErrors.push({ field: err.path, message: err.msg }));

  console.warn(`[${new Date().toISOString()}] Validation failed for request to POST /api/v1/contact. Errors count: ${extractedErrors.length}`);
  
  return res.status(400).json({
    success: false,
    message: 'Validation failed. Please check input parameters.',
    errors: extractedErrors
  });
};
