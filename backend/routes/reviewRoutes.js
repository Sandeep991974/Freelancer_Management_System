const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.post('/', authenticateToken, reviewController.submitReview);
router.get('/project/:projectId', authenticateToken, reviewController.getReviewsByProjectId);

module.exports = router;
