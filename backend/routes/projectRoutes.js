const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

router.post('/', authenticateToken, authorizeRoles('client'), projectController.createProject);
router.get('/', authenticateToken, projectController.getProjects);
router.get('/my-projects', authenticateToken, projectController.getMyProjects);
router.get('/:id', authenticateToken, projectController.getProjectById);
router.put('/:id', authenticateToken, projectController.updateProject);
router.delete('/:id', authenticateToken, projectController.deleteProject);

// Milestones
router.post('/milestones', authenticateToken, authorizeRoles('client'), projectController.addMilestone);
router.post('/milestones/status', authenticateToken, projectController.updateMilestoneStatus);

module.exports = router;
