const express = require('express');
const router = express.Router();
const bidController = require('../controllers/bidController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

router.post('/', authenticateToken, authorizeRoles('freelancer'), bidController.submitBid);
router.get('/project/:projectId', authenticateToken, bidController.getBidsByProjectId);
router.put('/:id/accept', authenticateToken, authorizeRoles('client'), bidController.acceptBid);
router.put('/:id/reject', authenticateToken, authorizeRoles('client'), bidController.rejectBid);
router.put('/:id/shortlist', authenticateToken, authorizeRoles('client'), bidController.shortlistBid);
router.put('/:id', authenticateToken, authorizeRoles('freelancer'), bidController.updateBid);
router.put('/:id/withdraw', authenticateToken, authorizeRoles('freelancer'), bidController.withdrawBid);

module.exports = router;
