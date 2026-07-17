// Services
const visitorService = require('./visitorService');

// Models
const Contact = require('../../models/Contact');
const ContactCrmMeta = require('../../models/admin/ContactCrmMeta');
const AdminActivityLog = require('../../models/admin/AdminActivityLog');
const logger = require('../../utils/logger');

// Local Memory Cache
let analyticsCache = {
  data: null,
  expiresAt: 0
};

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache TTL

const analyticsService = {
  /**
   * Invalidates cached statistics
   */
  invalidateCache: () => {
    analyticsCache.data = null;
    analyticsCache.expiresAt = 0;
    logger.activity('AnalyticsCache', 'Memory cache invalidated due to database mutations.');
  },

  /**
   * Fetch aggregated CRM and traffic statistics with caching fallback
   */
  getCachedAnalytics: async () => {
    const now = Date.now();
    if (analyticsCache.data && analyticsCache.expiresAt > now) {
      // Cache hit
      return analyticsCache.data;
    }

    // Cache miss - run database aggregates
    try {
      const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
      const startOfMonth = new Date(startOfDay.getFullYear(), startOfDay.getMonth(), 1);

      const [
        total,
        unread,
        starred,
        archived,
        deleted,
        statusDist,
        budgetDist,
        projectTypeDist,
        dailyTrend,
        trafficStats,
        recentActivity
      ] = await Promise.all([
        Contact.countDocuments(),
        ContactCrmMeta.countDocuments({ status: 'unread', isDeleted: { $ne: true } }),
        ContactCrmMeta.countDocuments({ starred: true, isDeleted: { $ne: true } }),
        ContactCrmMeta.countDocuments({ isArchived: true, isDeleted: { $ne: true } }),
        ContactCrmMeta.countDocuments({ isDeleted: true }),

        // Statuses
        ContactCrmMeta.aggregate([
          { $match: { isDeleted: { $ne: true } } },
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ]),

        // Budget list
        Contact.aggregate([
          {
            $lookup: {
              from: 'contactcrmmetas',
              localField: '_id',
              foreignField: 'contactId',
              as: 'crm'
            }
          },
          { $unwind: '$crm' },
          { $match: { 'crm.isDeleted': { $ne: true } } },
          { $group: { _id: '$budget', count: { $sum: 1 } } }
        ]),

        // Project Type
        Contact.aggregate([
          {
            $lookup: {
              from: 'contactcrmmetas',
              localField: '_id',
              foreignField: 'contactId',
              as: 'crm'
            }
          },
          { $unwind: '$crm' },
          { $match: { 'crm.isDeleted': { $ne: true } } },
          { $group: { _id: '$projectType', count: { $sum: 1 } } }
        ]),

        // Daily trend
        Contact.aggregate([
          { $match: { createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              count: { $sum: 1 }
            }
          },
          { $sort: { _id: 1 } }
        ]),

        // Traffic Analytics (visitors, bounce, top devices)
        visitorService.getTrafficStats(),

        // Log Timeline
        AdminActivityLog.find()
          .sort({ createdAt: -1 })
          .limit(10)
          .lean()
      ]);

      // Calculate averages
      const dailySum = dailyTrend.reduce((acc, curr) => acc + curr.count, 0);
      const avgDaily = dailyTrend.length > 0 ? (dailySum / dailyTrend.length).toFixed(1) : 0;

      const aggregatedData = {
        stats: {
          total,
          unread,
          starred,
          archived,
          deleted,
          avgDaily,
          traffic: trafficStats
        },
        statusDist,
        budgetDist,
        projectTypeDist,
        dailyTrend,
        recentActivity
      };

      // Populate Cache
      analyticsCache.data = aggregatedData;
      analyticsCache.expiresAt = now + CACHE_TTL_MS;
      logger.activity('AnalyticsCache', 'Memory cache populated with fresh database aggregates.');

      return aggregatedData;
    } catch (err) {
      logger.server('AnalyticsService', 'Database aggregation failed during cached stats lookup', err);
      throw err;
    }
  }
};

module.exports = analyticsService;
