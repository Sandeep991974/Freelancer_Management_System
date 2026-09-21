const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { authenticateToken } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.get('/history/:projectId', authenticateToken, chatController.getChatHistory);
router.post('/send/:projectId', authenticateToken, upload.single('file'), chatController.sendMessage);

module.exports = router;
