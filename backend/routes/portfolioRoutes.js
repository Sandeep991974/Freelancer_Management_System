const express = require('express');
const router = express.Router();
const portfolioController = require('../controllers/portfolioController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Public route to view a freelancer's portfolio
router.get('/freelancer/:id', portfolioController.getFreelancerPortfolio);

// Protected routes for freelancer managing their own portfolio
router.use(authenticateToken);
router.post('/', portfolioController.addPortfolioProject);
router.get('/my', portfolioController.getMyPortfolio);
router.delete('/:id', portfolioController.deletePortfolioProject);

module.exports = router;
