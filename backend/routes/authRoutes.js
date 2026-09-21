const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');

const upload = require('../middleware/uploadMiddleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/verify-otp', authController.verifyOTP);
router.post('/verify-2fa', authController.verify2FA);
router.post('/toggle-2fa', authenticateToken, authController.toggle2FA);
router.post('/google-login', authController.googleLogin);
router.post('/reset-password', authController.resetPassword);

router.get('/profile', authenticateToken, authController.getProfile);
router.put('/profile', authenticateToken, upload.fields([{ name: 'profile_photo', maxCount: 1 }, { name: 'resume', maxCount: 1 }]), authController.updateProfile);
router.get('/freelancers', authenticateToken, authController.getFreelancers);
router.get('/freelancers/:id', authenticateToken, authController.getFreelancerById);
router.post('/forgot-password', authController.forgotPassword);
router.post('/change-password', authenticateToken, authController.changePassword);

module.exports = router;
