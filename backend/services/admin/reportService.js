const logger = require('../../utils/logger');

const reportService = {
  /**
   * Format enquiries list to CSV string
   */
  generateCSV: (messages) => {
    try {
      const headers = ['Name', 'Email', 'Phone', 'Project Type', 'Budget', 'Description', 'Notes', 'Tags', 'Date', 'Status'];
      const rows = messages.map(m => {
        const crm = m.crm || {};
        return [
          m.fullName,
          m.email,
          m.phone || '',
          m.projectType,
          m.budget,
          (m.projectDescription || '').replace(/\n/g, ' '),
          (crm.notes || '').replace(/\n/g, ' '),
          (crm.tags || []).join(';'),
          m.createdAt ? new Date(m.createdAt).toISOString() : '',
          crm.status || 'unread'
        ];
      });

      const csvContent = [
        headers.join(','),
        ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      return csvContent;
    } catch (err) {
      logger.server('ReportService', 'CSV compilation failed', err);
      throw err;
    }
  },

  /**
   * Format enquiries list to Excel (TSV with UTF-8 BOM encoding)
   */
  generateExcel: (messages) => {
    try {
      const headers = ['Name', 'Email', 'Phone', 'Project Type', 'Budget', 'Description', 'Notes', 'Tags', 'Date', 'Status'];
      const rows = messages.map(m => {
        const crm = m.crm || {};
        return [
          m.fullName,
          m.email,
          m.phone || '',
          m.projectType,
          m.budget,
          (m.projectDescription || '').replace(/\n/g, ' '),
          (crm.notes || '').replace(/\n/g, ' '),
          (crm.tags || []).join(';'),
          m.createdAt ? new Date(m.createdAt).toISOString() : '',
          crm.status || 'unread'
        ];
      });

      // TSV layout works beautifully natively in Excel
      const tsvContent = [
        headers.join('\t'),
        ...rows.map(r => r.map(c => String(c).replace(/\t/g, ' ')).join('\t'))
      ].join('\n');

      // Prepend UTF-8 BOM
      return '\ufeff' + tsvContent;
    } catch (err) {
      logger.server('ReportService', 'Excel/TSV compilation failed', err);
      throw err;
    }
  }
};

module.exports = reportService;
