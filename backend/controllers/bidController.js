const { getPool } = require('../config/db');

// Submit Bid (Freelancer only)
async function submitBid(req, res) {
  try {
    const { project_id, bid_amount, proposal, delivery_days } = req.body;
    const freelancerId = req.user.id;

    if (!project_id || !bid_amount || !proposal || !delivery_days) {
      return res.status(400).json({ error: 'Please provide project_id, bid_amount, proposal and delivery_days.' });
    }

    const pool = await getPool();

    // Verify project is open
    const [projects] = await pool.query('SELECT status, client_id FROM projects WHERE id = ?', [project_id]);
    if (projects.length === 0) {
      return res.status(404).json({ error: 'Project not found.' });
    }
    if (projects[0].status !== 'open') {
      return res.status(400).json({ error: 'This project is no longer accepting bids.' });
    }

    // Verify freelancer is not the project client
    if (projects[0].client_id === freelancerId) {
      return res.status(400).json({ error: 'You cannot bid on your own project.' });
    }

    // Check if freelancer already bid on this project
    const [existing] = await pool.query(
      'SELECT id FROM bids WHERE project_id = ? AND freelancer_id = ?',
      [project_id, freelancerId]
    );
    if (existing.length > 0) {
      return res.status(400).json({ error: 'You have already submitted a bid for this project.' });
    }

    // Insert bid
    const [result] = await pool.query(
      'INSERT INTO bids (project_id, freelancer_id, bid_amount, proposal, delivery_days) VALUES (?, ?, ?, ?, ?)',
      [project_id, freelancerId, bid_amount, proposal, delivery_days]
    );

    res.status(201).json({
      message: 'Bid submitted successfully',
      bidId: result.insertId,
      bid: { id: result.insertId, project_id, freelancer_id: freelancerId, bid_amount, proposal, delivery_days, status: 'pending' }
    });
  } catch (error) {
    console.error('Submit bid error:', error);
    res.status(500).json({ error: 'Database error submitting bid.' });
  }
}

// Get Bids for a Project (Client or bidding Freelancer)
async function getBidsByProjectId(req, res) {
  try {
    const { projectId } = req.params;
    const pool = await getPool();

    // Verify project exists
    const [projects] = await pool.query('SELECT client_id FROM projects WHERE id = ?', [projectId]);
    if (projects.length === 0) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    // If requester is not the client, they can only see their own bid
    const isClient = projects[0].client_id === req.user.id;
    let query = `
      SELECT b.*, u.name as freelancer_name, u.skills as freelancer_skills, u.bio as freelancer_bio
      FROM bids b
      JOIN users u ON b.freelancer_id = u.id
      WHERE b.project_id = ?
    `;
    let queryParams = [projectId];

    if (!isClient) {
      query += ' AND b.freelancer_id = ?';
      queryParams.push(req.user.id);
    }

    const [bids] = await pool.query(query, queryParams);
    res.json(bids);
  } catch (error) {
    console.error('Fetch bids error:', error);
    res.status(500).json({ error: 'Database error fetching bids.' });
  }
}

// Accept Bid (Client only)
async function acceptBid(req, res) {
  const { id } = req.params; // Bid ID
  const pool = await getPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Fetch bid details and verify
    const [bids] = await connection.query('SELECT * FROM bids WHERE id = ?', [id]);
    if (bids.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Bid not found.' });
    }

    const bid = bids[0];

    // 2. Fetch project and verify client owns it and project is open
    const [projects] = await connection.query('SELECT * FROM projects WHERE id = ?', [bid.project_id]);
    if (projects.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Project not found.' });
    }

    const project = projects[0];
    if (project.client_id !== req.user.id) {
      await connection.rollback();
      return res.status(403).json({ error: 'Only the project creator can accept bids.' });
    }
    if (project.status !== 'open') {
      await connection.rollback();
      return res.status(400).json({ error: 'Project is already in progress or completed.' });
    }

    // 3. Accept this bid
    await connection.query('UPDATE bids SET status = "accepted" WHERE id = ?', [id]);

    // 4. Reject other bids for this project
    await connection.query('UPDATE bids SET status = "rejected" WHERE project_id = ? AND id != ?', [bid.project_id, id]);

    // 5. Update project status to 'in_progress'
    await connection.query('UPDATE projects SET status = "in_progress" WHERE id = ?', [bid.project_id]);

    // 6. Seed payment entry (escrow simulation - client owes payment to freelancer)
    await connection.query(
      'INSERT INTO payments (project_id, client_id, freelancer_id, amount, payment_status) VALUES (?, ?, ?, ?, "pending")',
      [bid.project_id, project.client_id, bid.freelancer_id, bid.bid_amount]
    );

    await connection.commit();
    res.json({ message: 'Bid accepted successfully. Project is now in progress and escrow is initialized.' });
  } catch (error) {
    await connection.rollback();
    console.error('Accept bid transaction error:', error);
    res.status(500).json({ error: 'Database transaction error accepting bid.' });
  } finally {
    connection.release();
  }
}

// Reject Bid (Client only)
async function rejectBid(req, res) {
  try {
    const { id } = req.params;
    const pool = await getPool();

    // Verify bid exists
    const [bids] = await pool.query('SELECT project_id FROM bids WHERE id = ?', [id]);
    if (bids.length === 0) {
      return res.status(404).json({ error: 'Bid not found.' });
    }

    // Verify project ownership
    const [projects] = await pool.query('SELECT client_id FROM projects WHERE id = ?', [bids[0].project_id]);
    if (projects[0].client_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the project creator can reject bids.' });
    }

    // Update status to rejected
    await pool.query('UPDATE bids SET status = "rejected" WHERE id = ?', [id]);
    res.json({ message: 'Bid rejected successfully.' });
  } catch (error) {
    console.error('Reject bid error:', error);
    res.status(500).json({ error: 'Database error rejecting bid.' });
  }
}

// Update Bid (Freelancer only)
async function updateBid(req, res) {
  try {
    const { id } = req.params;
    const { bid_amount, proposal, delivery_days } = req.body;
    const pool = await getPool();

    // Verify bid exists and belongs to freelancer
    const [bids] = await pool.query('SELECT project_id, freelancer_id, status FROM bids WHERE id = ?', [id]);
    if (bids.length === 0) return res.status(404).json({ error: 'Bid not found.' });
    if (bids[0].freelancer_id !== req.user.id) return res.status(403).json({ error: 'Unauthorized.' });
    if (bids[0].status !== 'pending') return res.status(400).json({ error: 'Can only edit pending bids.' });

    // Verify project is still open
    const [projects] = await pool.query('SELECT status FROM projects WHERE id = ?', [bids[0].project_id]);
    if (projects.length === 0 || projects[0].status !== 'open') {
      return res.status(400).json({ error: 'Project is no longer open.' });
    }

    await pool.query(
      'UPDATE bids SET bid_amount = ?, proposal = ?, delivery_days = ? WHERE id = ?',
      [bid_amount, proposal, delivery_days, id]
    );

    res.json({ message: 'Bid updated successfully.' });
  } catch (error) {
    console.error('Update bid error:', error);
    res.status(500).json({ error: 'Database error updating bid.' });
  }
}

// Withdraw Bid (Freelancer only)
async function withdrawBid(req, res) {
  try {
    const { id } = req.params;
    const pool = await getPool();

    // Verify bid exists and belongs to freelancer
    const [bids] = await pool.query('SELECT freelancer_id, status FROM bids WHERE id = ?', [id]);
    if (bids.length === 0) return res.status(404).json({ error: 'Bid not found.' });
    if (bids[0].freelancer_id !== req.user.id) return res.status(403).json({ error: 'Unauthorized.' });
    if (bids[0].status !== 'pending') return res.status(400).json({ error: 'Can only withdraw pending bids.' });

    await pool.query('UPDATE bids SET status = "withdrawn" WHERE id = ?', [id]);
    res.json({ message: 'Bid withdrawn successfully.' });
  } catch (error) {
    console.error('Withdraw bid error:', error);
    res.status(500).json({ error: 'Database error withdrawing bid.' });
  }
}

// Shortlist Bid (Client only)
async function shortlistBid(req, res) {
  try {
    const { id } = req.params;
    const pool = await getPool();

    // Verify bid exists
    const [bids] = await pool.query('SELECT project_id, freelancer_id FROM bids WHERE id = ?', [id]);
    if (bids.length === 0) {
      return res.status(404).json({ error: 'Bid not found.' });
    }

    // Verify project ownership
    const [projects] = await pool.query('SELECT client_id, title FROM projects WHERE id = ?', [bids[0].project_id]);
    if (projects[0].client_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the project creator can shortlist bids.' });
    }

    await pool.query('UPDATE bids SET status = "shortlisted" WHERE id = ?', [id]);

    // Send Notification to freelancer
    const { createNotification } = require('./notificationController');
    await createNotification(
      bids[0].freelancer_id,
      `Your bid for the project "${projects[0].title}" has been shortlisted!`,
      'bid_shortlisted',
      req.app
    );

    res.json({ message: 'Bid shortlisted successfully.' });
  } catch (error) {
    console.error('Shortlist bid error:', error);
    res.status(500).json({ error: 'Database error shortlisting bid.' });
  }
}

module.exports = {
  submitBid,
  getBidsByProjectId,
  acceptBid,
  rejectBid,
  shortlistBid,
  updateBid,
  withdrawBid
};
