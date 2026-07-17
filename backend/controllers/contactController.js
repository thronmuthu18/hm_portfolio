const mongoose = require('mongoose');
const Contact = require('../models/Contact');
const emailService = require('../services/emailService');
const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');

/**
 * Submit Contact Enquiry Request
 * POST /api/v1/contact
 */
exports.submitContact = async (req, res, next) => {
  try {
    // 1. Reject unexpected fields (Schema lockdown constraint)
    const allowedKeys = ['fullName', 'email', 'phone', 'projectType', 'budget', 'projectDescription'];
    const bodyKeys = Object.keys(req.body);
    const unexpectedKeys = bodyKeys.filter(key => !allowedKeys.includes(key));
    
    if (unexpectedKeys.length > 0) {
      logger.api('ContactController', `Blocked payload with unexpected fields: ${unexpectedKeys.join(', ')} from ${req.ip}`);
      return next(new ApiError(`Unexpected parameters rejected: ${unexpectedKeys.join(', ')}`, 400));
    }

    const { fullName, email, phone, projectType, budget, projectDescription } = req.body;
    logger.api('ContactController', `Processing new enquiry submission from ${req.ip || 'unknown'}`);

    let newEnquiryId;
    let submittedAt;

    // 2. Save enquiry to MongoDB Atlas database or fallback to mock log if offline
    if (mongoose.connection.readyState === 1) {
      const newEnquiry = await Contact.create({
        fullName,
        email,
        phone,
        projectType,
        budget,
        projectDescription
      });
      newEnquiryId = newEnquiry._id;
      submittedAt = newEnquiry.createdAt;
      logger.database('ContactController', `Enquiry saved to MongoDB. ID: ${newEnquiryId}`);
    } else {
      newEnquiryId = new mongoose.Types.ObjectId();
      submittedAt = new Date();
      console.warn(`[DEV DATABASE WARN] MongoDB is offline. Falling back to local logging for inquiry:\n`, {
        fullName,
        email,
        phone,
        projectType,
        budget,
        projectDescription
      });
    }

    // 3. Send professional email notification (Asynchronous / Non-blocking)
    // Email service catches internally, avoiding crash loops in API responses
    emailService.sendEnquiryEmail({
      fullName,
      email,
      phone,
      projectType,
      budget,
      projectDescription
    });

    // 4. Return REST-compliant Success Response (201 Created)
    return res.status(201).json({
      success: true,
      message: 'Your enquiry has been submitted successfully.',
      data: {
        id: newEnquiryId,
        submittedAt: submittedAt
      }
    });

  } catch (error) {
    logger.server('ContactController', 'Failed to save enquiry to MongoDB', { error: error.message });
    return next(new ApiError('Failed to record inquiry in database.', 500));
  }
};
