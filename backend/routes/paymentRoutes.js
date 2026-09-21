const express = require('express');
const router = Router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

router.get('/wallet', authenticateToken, paymentController.getWallet);
router.post('/deposit', authenticateToken, authorizeRoles('client'), paymentController.depositFunds);
router.post('/withdraw', authenticateToken, authorizeRoles('freelancer'), paymentController.withdrawRequest);

router.post('/release/:projectId', authenticateToken, authorizeRoles('client'), paymentController.releasePayment);
router.get('/project/:projectId', authenticateToken, paymentController.getPaymentDetails);

module.exports = router;
