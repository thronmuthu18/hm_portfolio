const mongoose = require('mongoose');

const crmVisitorSchema = new mongoose.Schema(
  {
    visitorId: {
      type: String,
      required: true,
      unique: true,
      index: true // Hash of IP + User-Agent or random UUID
    },
    ip: { type: String, default: 'Unknown' },
    country: { type: String, default: 'Unknown', index: true },
    region: { type: String, default: 'Unknown' },
    city: { type: String, default: 'Unknown' },
    timezone: { type: String, default: 'UTC' },
    language: { type: String, default: 'en' },
    browser: { type: String, default: 'Unknown', index: true },
    os: { type: String, default: 'Unknown', index: true },
    device: { type: String, default: 'Unknown', index: true },
    platform: { type: String, default: 'Unknown' },
    screenResolution: { type: String, default: 'Unknown' },
    visitCount: { type: Number, default: 1 },
    isReturning: { type: Boolean, default: false }
  },
  {
    timestamps: true
  }
);

const CrmVisitor = mongoose.model('CrmVisitor', crmVisitorSchema);

module.exports = CrmVisitor;
