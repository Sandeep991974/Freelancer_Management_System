const express = require('express');
const router = express.Router();
const { getPool } = require('../config/db');

// Get Open Projects (Public - no auth required)
router.get('/projects', async (req, res) => {
  try {
    const pool = await getPool();
    const [projects] = await pool.query(`
      SELECT p.id, p.title, p.description, p.budget, p.skills_required, p.status, p.created_at,
             u.name as client_name
      FROM projects p
      JOIN users u ON p.client_id = u.id
      WHERE p.status = 'open'
      ORDER BY p.created_at DESC
      LIMIT 20
    `);
    res.json(projects);
  } catch (error) {
    console.error('Public projects fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch projects.' });
  }
});

// Get Freelancers (Public - no auth required)
router.get('/freelancers', async (req, res) => {
  try {
    const pool = await getPool();
    const [freelancers] = await pool.query(`
      SELECT u.id, u.name, u.skills, u.bio, u.hourly_rate, u.created_at,
             IFNULL(AVG(r.rating), 0) as avg_rating, COUNT(r.id) as review_count
      FROM users u
      LEFT JOIN reviews r ON u.id = r.reviewee_id
      WHERE u.role = 'freelancer'
      GROUP BY u.id
      ORDER BY avg_rating DESC
      LIMIT 20
    `);
    res.json(freelancers);
  } catch (error) {
    console.error('Public freelancers fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch freelancers.' });
  }
});

// Get platform stats (Public)
router.get('/stats', async (req, res) => {
  try {
    const pool = await getPool();
    const [[{ totalFreelancers }]] = await pool.query("SELECT COUNT(*) as totalFreelancers FROM users WHERE role='freelancer'");
    const [[{ totalClients }]] = await pool.query("SELECT COUNT(*) as totalClients FROM users WHERE role='client'");
    const [[{ totalProjects }]] = await pool.query("SELECT COUNT(*) as totalProjects FROM projects");
    const [[{ completedProjects }]] = await pool.query("SELECT COUNT(*) as completedProjects FROM projects WHERE status='completed'");
    res.json({ totalFreelancers, totalClients, totalProjects, completedProjects });
  } catch (error) {
    console.error('Public stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats.' });
  }
});

module.exports = router;
