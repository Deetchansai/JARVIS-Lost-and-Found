const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const itemController = require('../controllers/itemController');
const matchController = require('../controllers/matchController');
const notificationService = require('../services/notificationService');

// --- Health Check ---
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'campus-lost-and-found-backend',
    timestamp: new Date().toISOString(),
  });
});

// --- Auth Routes ---
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.get('/auth/profile', authController.getProfile);

// --- Items Routes ---
router.get('/items', itemController.getItems);
router.post('/items', itemController.reportItem);
router.get('/items/:id', itemController.getItemById);
router.patch('/items/:id/status', itemController.updateStatus);

// --- Match Evaluation Routes ---
router.get('/matches/:itemId', (req, res) => matchController.getItemMatches(req, res));
router.patch('/matches/:matchId/status', (req, res) => matchController.updateMatchStatus(req, res));

// --- Notifications Routes ---
router.get('/notifications', async (req, res) => {
  try {
    const userId = req.query.userId || req.user?.id;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'userId query parameter required' });
    }
    const notifications = await notificationService.getUserNotifications(userId);
    return res.json({ success: true, count: notifications.length, notifications });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.patch('/notifications/:id/read', async (req, res) => {
  try {
    const userId = req.query.userId || req.user?.id;
    const notification = await notificationService.markAsRead(req.params.id, userId);
    return res.json({ success: true, notification });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
