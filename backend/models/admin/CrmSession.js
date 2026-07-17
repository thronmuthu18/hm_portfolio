const mongoose = require('mongoose');

const crmSessionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    visitorId: {
      type: String,
      required: true,
      index: true
    },
    startTime: {
      type: Date,
      default: Date.now,
      index: true
    },
    endTime: {
      type: Date,
      default: null
    },
    duration: {
      type: Number,
      default: 0 // Duration in seconds
    },
    pagesVisited: {
      type: [String],
      default: [] // Array of API routes or page hashes hit
    },
    lastActivity: {
      type: Date,
      default: Date.now
    },
    referrer: {
      type: String,
      default: 'Direct'
    },
    landingPage: {
      type: String,
      default: '/'
    },
    bounce: {
      type: Boolean,
      default: true // A session starts as a bounce, cleared if > 1 page view or session duration > 10s
    }
  },
  {
    timestamps: true
  }
);

crmSessionSchema.index({ startTime: -1 });

const CrmSession = mongoose.model('CrmSession', crmSessionSchema);

module.exports = CrmSession;
