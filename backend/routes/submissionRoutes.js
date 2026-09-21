const express = require('express');
const router = express.Router();
const submissionController = require('../controllers/submissionController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/', authenticateToken, authorizeRoles('freelancer'), upload.single('file'), submissionController.submitWork);
router.get('/project/:projectId', authenticateToken, submissionController.getSubmissions);
router.put('/:id/review', authenticateToken, authorizeRoles('client'), submissionController.reviewSubmission);

module.exports = router;
