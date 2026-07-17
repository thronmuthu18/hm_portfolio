const mongoose = require('mongoose');

const adminSessionSchema = new mongoose.Schema(
  {
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    familyId: {
      type: String,
      required: true,
      index: true // Family ID to trace token rotations
    },
    ip: {
      type: String,
      default: 'Unknown'
    },
    userAgent: {
      type: String,
      default: 'Unknown'
    },
    device: {
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
    rotated: {
      type: Boolean,
      default: false
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 } // Document auto-deletes when expired
    }
  },
  {
    timestamps: true
  }
);

const AdminSession = mongoose.model('AdminSession', adminSessionSchema);

module.exports = AdminSession;
