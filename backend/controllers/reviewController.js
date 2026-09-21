const { getPool } = require('../config/db');

// Submit Review
async function submitReview(req, res) {
  try {
    const { project_id, reviewee_id, rating, comment } = req.body;
    const reviewerId = req.user.id;

    if (!project_id || !reviewee_id || !rating) {
      return res.status(400).json({ error: 'Please provide project_id, reviewee_id and rating.' });
    }

    const ratingVal = parseInt(rating, 10);
    if (isNaN(ratingVal) || ratingVal < 1 || ratingVal > 5) {
      return res.status(400).json({ error: 'Rating must be an integer between 1 and 5.' });
    }

    if (reviewerId === parseInt(reviewee_id, 10)) {
      return res.status(400).json({ error: 'You cannot rate yourself.' });
    }

    const pool = await getPool();

    // 1. Verify project exists and is completed
    const [projects] = await pool.query('SELECT status, client_id FROM projects WHERE id = ?', [project_id]);
    if (projects.length === 0) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    const project = projects[0];
    if (project.status !== 'completed') {
      return res.status(400).json({ error: 'You can only leave reviews for completed projects.' });
    }

    // 2. Fetch hired freelancer
    const [bids] = await pool.query(
      'SELECT freelancer_id FROM bids WHERE project_id = ? AND status = "accepted"',
      [project_id]
    );
    const hiredFreelancerId = bids.length > 0 ? bids[0].freelancer_id : null;

    // Verify reviewer and reviewee are the correct parties
    const isClientReviewingFreelancer = reviewerId === project.client_id && parseInt(reviewee_id, 10) === hiredFreelancerId;
    const isFreelancerReviewingClient = reviewerId === hiredFreelancerId && parseInt(reviewee_id, 10) === project.client_id;

    if (!isClientReviewingFreelancer && !isFreelancerReviewingClient) {
      return res.status(400).json({ error: 'You are not authorized to rate this user for this project.' });
    }

    // 3. Prevent double reviews
    const [existing] = await pool.query(
      'SELECT id FROM reviews WHERE project_id = ? AND reviewer_id = ? AND reviewee_id = ?',
      [project_id, reviewerId, reviewee_id]
    );
    if (existing.length > 0) {
      return res.status(400).json({ error: 'You have already reviewed this user for this project.' });
    }

    // 4. Save review
    const [result] = await pool.query(
      'INSERT INTO reviews (project_id, reviewer_id, reviewee_id, rating, comment) VALUES (?, ?, ?, ?, ?)',
      [project_id, reviewerId, reviewee_id, ratingVal, comment || '']
    );

    res.status(201).json({
      message: 'Review submitted successfully',
      reviewId: result.insertId,
      review: { id: result.insertId, project_id, reviewer_id: reviewerId, reviewee_id, rating: ratingVal, comment }
    });
  } catch (error) {
    console.error('Submit review error:', error);
    res.status(500).json({ error: 'Database error submitting review.' });
  }
}

// Get Reviews for a Project
async function getReviewsByProjectId(req, res) {
  try {
    const { projectId } = req.params;
    const pool = await getPool();

    const [reviews] = await pool.query(`
      SELECT r.*, u.name as reviewer_name, u.role as reviewer_role
      FROM reviews r
      JOIN users u ON r.reviewer_id = u.id
      WHERE r.project_id = ?
    `, [projectId]);

    res.json(reviews);
  } catch (error) {
    console.error('Fetch reviews error:', error);
    res.status(500).json({ error: 'Database error fetching reviews.' });
  }
}

module.exports = {
  submitReview,
  getReviewsByProjectId
};
