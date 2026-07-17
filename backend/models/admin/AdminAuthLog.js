const mongoose = require('mongoose');

const adminAuthLogSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      index: true
    },
    ip: {
      type: String,
      required: true,
      index: true
    },
    userAgent: {
      type: String,
      default: 'Unknown'
    },
    browser: {
      type: String,
      default: 'Unknown'
    },
    os: {
      type: String,
      default: 'Unknown'
    },
    device: {
      type: String,
      default: 'Unknown'
    },
    success: {
      type: Boolean,
      required: true,
      index: true
    },
    reason: {
      type: String,
      default: '' // Reason for failure (e.g. 'Invalid password', 'Locked out')
    }
  },
  {
    timestamps: true
  }
);

// TTL index to automatically prune auth logs older than 90 days for storage efficiency
adminAuthLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

const AdminAuthLog = mongoose.model('AdminAuthLog', adminAuthLogSchema);

module.exports = AdminAuthLog;
