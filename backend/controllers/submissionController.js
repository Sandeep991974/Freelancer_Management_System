const { getPool } = require('../config/db');

// Submit Work (Freelancer only)
async function submitWork(req, res) {
  try {
    const { project_id, work_description } = req.body;
    const freelancerId = req.user.id;
    let fileUrl = null;

    if (req.file) {
      fileUrl = `/uploads/${req.file.filename}`;
    }

    if (!project_id || !work_description) {
      return res.status(400).json({ error: 'Please provide project_id and work_description.' });
    }

    const pool = await getPool();

    // Verify project exists and status is in_progress
    const [projects] = await pool.query('SELECT status FROM projects WHERE id = ?', [project_id]);
    if (projects.length === 0) {
      return res.status(404).json({ error: 'Project not found.' });
    }
    if (projects[0].status !== 'in_progress') {
      return res.status(400).json({ error: 'Work can only be submitted for in-progress projects.' });
    }

    // Verify freelancer is hired for this project
    const [bids] = await pool.query(
      'SELECT id FROM bids WHERE project_id = ? AND freelancer_id = ? AND status = "accepted"',
      [project_id, freelancerId]
    );
    if (bids.length === 0) {
      return res.status(403).json({ error: 'You are not hired for this project.' });
    }

    // Insert submission
    const [result] = await pool.query(
      'INSERT INTO submissions (project_id, freelancer_id, work_description, file_url, status) VALUES (?, ?, ?, ?, "pending")',
      [project_id, freelancerId, work_description, fileUrl]
    );

    res.status(201).json({
      message: 'Work submitted successfully for client review',
      submissionId: result.insertId,
      submission: { id: result.insertId, project_id, freelancer_id: freelancerId, work_description, file_url: fileUrl, status: 'pending' }
    });
  } catch (error) {
    console.error('Submit work error:', error);
    res.status(500).json({ error: 'Database error submitting work.' });
  }
}

// Get Submissions for a Project
async function getSubmissions(req, res) {
  try {
    const { projectId } = req.params;
    const pool = await getPool();

    // Verify user is either client or freelancer for this project
    const [projects] = await pool.query('SELECT client_id FROM projects WHERE id = ?', [projectId]);
    if (projects.length === 0) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    const client_id = projects[0].client_id;
    const [hired] = await pool.query(
      'SELECT freelancer_id FROM bids WHERE project_id = ? AND status = "accepted"',
      [projectId]
    );
    const freelancer_id = hired.length > 0 ? hired[0].freelancer_id : null;

    if (req.user.id !== client_id && req.user.id !== freelancer_id) {
      return res.status(403).json({ error: 'You are not authorized to view submissions for this project.' });
    }

    const [submissions] = await pool.query(`
      SELECT s.*, u.name as freelancer_name
      FROM submissions s
      JOIN users u ON s.freelancer_id = u.id
      WHERE s.project_id = ?
      ORDER BY s.created_at DESC
    `, [projectId]);

    res.json(submissions);
  } catch (error) {
    console.error('Fetch submissions error:', error);
    res.status(500).json({ error: 'Database error fetching submissions.' });
  }
}

// Review Submission (Client only)
async function reviewSubmission(req, res) {
  const { id } = req.params;
  const { status } = req.body; // 'approved' or 'rejected'
  
  if (status !== 'approved' && status !== 'rejected') {
    return res.status(400).json({ error: "Status must be either 'approved' or 'rejected'." });
  }

  const pool = await getPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Fetch submission details
    const [submissions] = await connection.query('SELECT * FROM submissions WHERE id = ?', [id]);
    if (submissions.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Submission not found.' });
    }

    const submission = submissions[0];

    // 2. Verify project ownership by client
    const [projects] = await connection.query('SELECT client_id, status FROM projects WHERE id = ?', [submission.project_id]);
    if (projects.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Project not found.' });
    }

    const project = projects[0];
    if (project.client_id !== req.user.id) {
      await connection.rollback();
      return res.status(403).json({ error: 'Only the project creator can review submissions.' });
    }

    // 3. Update submission status
    await connection.query('UPDATE submissions SET status = ? WHERE id = ?', [status, id]);

    // 4. If approved, transition project status to 'completed'
    if (status === 'approved') {
      await connection.query('UPDATE projects SET status = "completed" WHERE id = ?', [submission.project_id]);
    }

    await connection.commit();
    res.json({
      message: `Submission was successfully ${status}.`,
      status
    });
  } catch (error) {
    await connection.rollback();
    console.error('Review submission error:', error);
    res.status(500).json({ error: 'Database transaction error reviewing submission.' });
  } finally {
    connection.release();
  }
}

module.exports = {
  submitWork,
  getSubmissions,
  reviewSubmission
};
