const mongoose = require('mongoose');

const adminLockoutSchema = new mongoose.Schema(
  {
    ip: {
      type: String,
      required: true,
      index: true
    },
    username: {
      type: String,
      required: true,
      index: true
    },
    failedAttempts: {
      type: Number,
      default: 0
    },
    lockUntil: {
      type: Date,
      default: null
    },
    lockoutCount: {
      type: Number,
      default: 0 // Track number of lockouts to increase lockout duration progressively
    }
  },
  {
    timestamps: true
  }
);

// Compound index on IP and username
adminLockoutSchema.index({ ip: 1, username: 1 }, { unique: true });

const AdminLockout = mongoose.model('AdminLockout', adminLockoutSchema);

module.exports = AdminLockout;
