const mongoose = require('mongoose');

const contactCrmMetaSchema = new mongoose.Schema(
  {
    contactId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contact',
      required: true,
      unique: true,
      index: true
    },
    status: {
      type: String,
      enum: [
        'unread', 'read', 'in-progress', 'completed', 'archived', 'starred', 'cancelled',
        'new-lead', 'contacted', 'discussion', 'quotation-sent', 'negotiation', 'lost', 'won'
      ],
      default: 'new-lead'
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true
    },
    starred: {
      type: Boolean,
      default: false,
      index: true
    },
    notes: {
      type: String,
      default: ''
    },
    tags: {
      type: [String],
      default: []
    },
    followUpDate: {
      type: Date,
      default: null
    },
    followUpStatus: {
      type: String,
      enum: ['none', 'pending', 'completed', 'missed'],
      default: 'none'
    },
    followUpPriority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    visitor: {
      country: { type: String, default: 'Unknown' },
      browser: { type: String, default: 'Unknown' },
      os: { type: String, default: 'Unknown' },
      device: { type: String, default: 'Unknown' },
      screenSize: { type: String, default: 'Unknown' },
      language: { type: String, default: 'Unknown' },
      timezone: { type: String, default: 'Unknown' },
      referrer: { type: String, default: 'Direct' }
    },
    
    // ── CRM ENTERPRISE EXTENSIONS ──────────────────────────────────────────
    statusHistory: [
      {
        status: String,
        updatedAt: { type: Date, default: Date.now },
        changedBy: String
      }
    ],
    internalNotes: [
      {
        author: String,
        content: String,
        createdAt: { type: Date, default: Date.now }
      }
    ],
    tasks: [
      {
        title: { type: String, required: true },
        deadline: { type: Date, default: null },
        priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
        completed: { type: Boolean, default: false }
      }
    ],
    attachments: [
      {
        name: String,
        mimeType: String,
        size: Number,
        data: String, // Base64 data string
        uploadedAt: { type: Date, default: Date.now }
      }
    ],
    emailHistory: [
      {
        subject: String,
        body: String,
        sentAt: { type: Date, default: Date.now },
        status: { type: String, default: 'sent' }
      }
    ]
  },
  {
    timestamps: true
  }
);

// Indexes for performance optimized query sorting
contactCrmMetaSchema.index({ status: 1 });
contactCrmMetaSchema.index({ followUpDate: 1 });
contactCrmMetaSchema.index({ starred: 1, isArchived: 1, isDeleted: 1 });

const ContactCrmMeta = mongoose.model('ContactCrmMeta', contactCrmMetaSchema);

module.exports = ContactCrmMeta;
