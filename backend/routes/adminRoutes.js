const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Public or general authenticated CMS access
router.get('/cms', adminController.getCms);

// Authenticated reporting path (accessible to all roles)
router.post('/reports', authenticateToken, adminController.submitReport);

// Middleware to ensure user is admin
function requireAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Forbidden. Admin access required.' });
  }
}

// Protect remaining admin-only routes
router.use(authenticateToken);
router.use(requireAdmin);

router.get('/overview', adminController.getOverview);
router.get('/users', adminController.getAllUsers);
router.put('/users/:id/block', adminController.toggleBlockUser);
router.put('/users/:id/verify', adminController.verifyUserAccount);
router.put('/users/:id/role', adminController.updateUserRole);
router.delete('/users/:id', adminController.deleteUser);

router.get('/projects', adminController.getAllProjects);
router.delete('/projects/:id', adminController.deleteProject);
router.put('/projects/:id/status', adminController.updateProjectStatus);

router.get('/withdrawals', adminController.getWithdrawals);
router.put('/withdrawals/:id', adminController.processWithdrawal);

router.get('/reports', adminController.getReports);
router.put('/reports/:id/resolve', adminController.resolveReport);

router.post('/cms', adminController.updateCms);
router.post('/broadcast', adminController.broadcast);

module.exports = router;
