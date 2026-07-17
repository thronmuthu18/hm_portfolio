const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// Models
const Contact = require('../../models/Contact');
const ContactCrmMeta = require('../..//models/admin/ContactCrmMeta');
const logger = require('../../utils/logger');

const backupDir = path.join(__dirname, '../../backups');

if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

const databaseService = {
  /**
   * Programmatic indexing initializer
   */
  ensureIndexes: async () => {
    try {
      // 1. Core Contact collection indexes
      await Contact.collection.createIndex({ email: 1 });
      await Contact.collection.createIndex({ phone: 1 });
      await Contact.collection.createIndex({ createdAt: -1 });

      // 2. CRM Metadata indexes
      await ContactCrmMeta.collection.createIndex({ contactId: 1 });
      await ContactCrmMeta.collection.createIndex({ status: 1 });
      await ContactCrmMeta.collection.createIndex({ starred: 1 });
      await ContactCrmMeta.collection.createIndex({ isArchived: 1 });
      await ContactCrmMeta.collection.createIndex({ isDeleted: 1 });
      await ContactCrmMeta.collection.createIndex({ followUpDate: 1 });

      logger.activity('DatabaseService', 'Database indexes verified and generated successfully.');
    } catch (err) {
      logger.server('DatabaseService', 'Database indexing verification failed', err);
    }
  },

  /**
   * Create database JSON backup dump file
   */
  createBackup: async () => {
    try {
      const [contacts, crmMetas] = await Promise.all([
        Contact.find({}).lean(),
        ContactCrmMeta.find({}).lean()
      ]);

      const backupPayload = {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        data: {
          contacts,
          crmMetas
        }
      };

      const filename = `backup-${Date.now()}.json`;
      const filePath = path.join(backupDir, filename);

      fs.writeFileSync(filePath, JSON.stringify(backupPayload, null, 2));
      logger.activity('DatabaseService', `Manual database backup created: ${filename}`);
      
      return { success: true, filename, size: fs.statSync(filePath).size };
    } catch (err) {
      logger.server('DatabaseService', 'Manual backup dump failed', err);
      throw err;
    }
  },

  /**
   * Restore database collection records from dump file
   */
  restoreBackup: async (filename) => {
    const filePath = path.join(backupDir, filename);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Backup file ${filename} not found.`);
    }

    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const backup = JSON.parse(raw);

      if (!backup.data || !Array.isArray(backup.data.contacts)) {
        throw new Error('Invalid backup file schema structure.');
      }

      // Restore Contacts
      await Contact.deleteMany({});
      await Contact.insertMany(backup.data.contacts);

      // Restore CRM metadata
      await ContactCrmMeta.deleteMany({});
      if (Array.isArray(backup.data.crmMetas) && backup.data.crmMetas.length > 0) {
        await ContactCrmMeta.insertMany(backup.data.crmMetas);
      }

      logger.activity('DatabaseService', `Manual database restored successfully from file: ${filename}`);
      return { success: true, message: 'Database state restored successfully.' };
    } catch (err) {
      logger.server('DatabaseService', `Restore failed for backup: ${filename}`, err);
      throw err;
    }
  },

  /**
   * List available JSON backups
   */
  listBackups: () => {
    try {
      const files = fs.readdirSync(backupDir);
      return files
        .filter(f => f.startsWith('backup-') && f.endsWith('.json'))
        .map(f => {
          const stats = fs.statSync(path.join(backupDir, f));
          return {
            filename: f,
            size: `${(stats.size / 1024).toFixed(2)} KB`,
            createdAt: stats.birthtime
          };
        })
        .sort((a, b) => b.createdAt - a.createdAt);
    } catch (_) {
      return [];
    }
  }
};

module.exports = databaseService;
