const { getPool } = require('../config/db');

// Add a portfolio project
async function addPortfolioProject(req, res) {
  try {
    const { title, description, image_url, project_link } = req.body;
    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required.' });
    }

    const pool = await getPool();
    await pool.query(
      'INSERT INTO portfolio_projects (freelancer_id, title, description, image_url, project_link) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, title, description, image_url || null, project_link || null]
    );

    res.status(201).json({ message: 'Portfolio project added successfully.' });
  } catch (error) {
    console.error('Error adding portfolio project:', error);
    res.status(500).json({ error: 'Server error adding portfolio project.' });
  }
}

// Get portfolio projects for the logged in freelancer
async function getMyPortfolio(req, res) {
  try {
    const pool = await getPool();
    const [projects] = await pool.query(
      'SELECT * FROM portfolio_projects WHERE freelancer_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(projects);
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    res.status(500).json({ error: 'Server error fetching portfolio.' });
  }
}

// Get portfolio for a specific freelancer
async function getFreelancerPortfolio(req, res) {
  try {
    const { id } = req.params;
    const pool = await getPool();
    const [projects] = await pool.query(
      'SELECT * FROM portfolio_projects WHERE freelancer_id = ? ORDER BY created_at DESC',
      [id]
    );
    res.json(projects);
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    res.status(500).json({ error: 'Server error fetching portfolio.' });
  }
}

// Delete portfolio project
async function deletePortfolioProject(req, res) {
  try {
    const { id } = req.params;
    const pool = await getPool();

    // Ensure the project belongs to the user
    const [existing] = await pool.query('SELECT * FROM portfolio_projects WHERE id = ? AND freelancer_id = ?', [id, req.user.id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Project not found or unauthorized.' });
    }

    await pool.query('DELETE FROM portfolio_projects WHERE id = ?', [id]);
    res.json({ message: 'Portfolio project deleted successfully.' });
  } catch (error) {
    console.error('Error deleting portfolio project:', error);
    res.status(500).json({ error: 'Server error deleting portfolio project.' });
  }
}

module.exports = {
  addPortfolioProject,
  getMyPortfolio,
  getFreelancerPortfolio,
  deletePortfolioProject
};
