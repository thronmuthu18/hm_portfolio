const express = require('express');
const router = express.Router();
const contactRoutes = require('./v1/contactRoutes');
const adminRoutes = require('./admin/adminRoutes');

// API Health Check (monitoring compliance)
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'API system is operational.',
    timestamp: new Date()
  });
});

// Bind v1 sub-routers
router.use('/v1/contact', contactRoutes);
router.use('/v1/admin', adminRoutes);

module.exports = router;
