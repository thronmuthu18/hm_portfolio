const mongoose = require('mongoose');

const adminActivityLogSchema = new mongoose.Schema(
  {
    adminUsername: {
      type: String,
      required: true,
      index: true
    },
    action: {
      type: String,
      required: true,
      index: true // e.g. 'delete_message', 'archive_message', 'change_password'
    },
    targetId: {
      type: String,
      default: null // The ID of the target resource (e.g. contactId)
    },
    details: {
      type: String,
      default: '' // Additional context about the action
    },
    ip: {
      type: String,
      default: 'Unknown'
    },
    userAgent: {
      type: String,
      default: 'Unknown'
    }
  },
  {
    timestamps: true
  }
);

// Prune logs automatically after 180 days (6 months)
adminActivityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 180 * 24 * 60 * 60 });

const AdminActivityLog = mongoose.model('AdminActivityLog', adminActivityLogSchema);

module.exports = AdminActivityLog;
