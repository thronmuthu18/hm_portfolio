const mongoose = require('mongoose');

/**
 * Contact Enquiry Schema
 * Defines the schema structure and validations for customer leads submissions
 */
const contactSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Please provide your full name.'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters.'],
      maxlength: [80, 'Name cannot exceed 80 characters.']
    },
    email: {
      type: String,
      required: [true, 'Please provide your email address.'],
      trim: true,
      lowercase: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        'Please provide a valid email address.'
      ]
    },
    phone: {
      type: String,
      trim: true,
      maxlength: [20, 'Phone number cannot exceed 20 characters.'],
      default: ''
    },
    projectType: {
      type: String,
      required: [true, 'Please select a project type.'],
      trim: true,
      maxlength: [100, 'Project type text cannot exceed 100 characters.']
    },
    budget: {
      type: String,
      required: [true, 'Please specify your project budget.'],
      trim: true,
      maxlength: [50, 'Budget description cannot exceed 50 characters.']
    },
    projectDescription: {
      type: String,
      required: [true, 'Please provide a project description.'],
      trim: true,
      minlength: [10, 'Project description must be at least 10 characters.'],
      maxlength: [2000, 'Project description cannot exceed 2000 characters.']
    }
  },
  {
    timestamps: true // Automatically generates and manages createdAt and updatedAt fields
  }
);

// Indexes for performance optimization on future query lookups (e.g., date ranges, email searches)
contactSchema.index({ email: 1 });
contactSchema.index({ createdAt: -1 });

const Contact = mongoose.model('Contact', contactSchema);

module.exports = Contact;
