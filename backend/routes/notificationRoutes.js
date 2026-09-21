const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.get('/', authenticateToken, notificationController.getNotifications);
router.post('/mark-read', authenticateToken, notificationController.markRead);

module.exports = router;
