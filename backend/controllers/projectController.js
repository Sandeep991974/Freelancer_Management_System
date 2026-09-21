const { getPool } = require('../config/db');
const { createNotification } = require('./notificationController');

// Create Project (Client only)
async function createProject(req, res) {
  try {
    const { title, description, budget, skills_required, category, experience_level, deadline } = req.body;
    
    if (!title || !description || !budget) {
      return res.status(400).json({ error: 'Please provide title, description and budget.' });
    }

    const pool = await getPool();
    const [result] = await pool.query(
      'INSERT INTO projects (client_id, title, description, budget, skills_required, category, experience_level, deadline) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, title, description, budget, skills_required, category || null, experience_level || 'intermediate', deadline || null]
    );

    res.status(201).json({
      message: 'Project posted successfully',
      projectId: result.insertId,
      project: { id: result.insertId, client_id: req.user.id, title, description, budget, skills_required, category, experience_level, deadline, status: 'open' }
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Database error posting project.' });
  }
}

// Get All Open/Active Projects
async function getProjects(req, res) {
  try {
    const pool = await getPool();
    const [projects] = await pool.query(`
      SELECT p.*, u.name as client_name
      FROM projects p
      JOIN users u ON p.client_id = u.id
      WHERE p.status = 'open'
      ORDER BY p.created_at DESC
    `);
    
    res.json(projects);
  } catch (error) {
    console.error('Fetch projects error:', error);
    res.status(500).json({ error: 'Database error fetching projects.' });
  }
}

// Update Project (Edit, Pause, Close, Cancel)
async function updateProject(req, res) {
  try {
    const { id } = req.params;
    const { title, description, budget, skills_required, category, experience_level, deadline, status } = req.body;
    const pool = await getPool();

    // Check project client
    const [projects] = await pool.query('SELECT * FROM projects WHERE id = ?', [id]);
    if (projects.length === 0) return res.status(404).json({ error: 'Project not found.' });

    const project = projects[0];
    if (project.client_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized to update this project.' });
    }

    await pool.query(`
      UPDATE projects SET
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        budget = COALESCE(?, budget),
        skills_required = COALESCE(?, skills_required),
        category = COALESCE(?, category),
        experience_level = COALESCE(?, experience_level),
        deadline = COALESCE(?, deadline),
        status = COALESCE(?, status)
      WHERE id = ?`,
      [title, description, budget, skills_required, category, experience_level, deadline, status, id]
    );

    // Notify freelancer if project status changed
    if (status && status !== project.status) {
      const [hired] = await pool.query('SELECT freelancer_id FROM bids WHERE project_id = ? AND status = "accepted"', [id]);
      if (hired.length > 0) {
        await createNotification(
          hired[0].freelancer_id,
          `The project "${project.title}" status has been updated to "${status}".`,
          'project_update',
          req.app
        );
      }
    }

    res.json({ message: 'Project updated successfully.' });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Database error updating project.' });
  }
}

// Delete Project
async function deleteProject(req, res) {
  try {
    const { id } = req.params;
    const pool = await getPool();

    const [projects] = await pool.query('SELECT * FROM projects WHERE id = ?', [id]);
    if (projects.length === 0) return res.status(404).json({ error: 'Project not found.' });

    const project = projects[0];
    if (project.client_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized to delete this project.' });
    }

    await pool.query('DELETE FROM projects WHERE id = ?', [id]);
    res.json({ message: 'Project deleted successfully.' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Database error deleting project.' });
  }
}

// Get User's Projects
async function getMyProjects(req, res) {
  try {
    const pool = await getPool();
    const userId = req.user.id;
    const role = req.user.role;

    if (role === 'client') {
      const [projects] = await pool.query(`
        SELECT p.*, u.name as freelancer_name, b.freelancer_id
        FROM projects p
        LEFT JOIN bids b ON p.id = b.project_id AND b.status = 'accepted'
        LEFT JOIN users u ON b.freelancer_id = u.id
        WHERE p.client_id = ?
        ORDER BY p.created_at DESC
      `, [userId]);
      res.json(projects);
    } else {
      const [projects] = await pool.query(`
        SELECT DISTINCT p.*, u.name as client_name, b.status as bid_status, b.bid_amount
        FROM projects p
        JOIN users u ON p.client_id = u.id
        JOIN bids b ON p.id = b.project_id
        WHERE b.freelancer_id = ?
        ORDER BY p.created_at DESC
      `, [userId]);
      res.json(projects);
    }
  } catch (error) {
    console.error('Fetch user projects error:', error);
    res.status(500).json({ error: 'Database error fetching user projects.' });
  }
}

// Get Project Details (includes milestones and bids)
async function getProjectById(req, res) {
  try {
    const { id } = req.params;
    const pool = await getPool();

    const [projects] = await pool.query(`
      SELECT p.*, u.name as client_name, u.email as client_email
      FROM projects p
      JOIN users u ON p.client_id = u.id
      WHERE p.id = ?
    `, [id]);

    if (projects.length === 0) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    const project = projects[0];

    const [hired] = await pool.query(`
      SELECT b.freelancer_id, u.name as freelancer_name, u.email as freelancer_email, b.bid_amount
      FROM bids b
      JOIN users u ON b.freelancer_id = u.id
      WHERE b.project_id = ? AND b.status = 'accepted'
      LIMIT 1
    `, [id]);

    const hiredFreelancer = hired.length > 0 ? hired[0] : null;

    // Get milestones
    const [milestones] = await pool.query('SELECT * FROM milestones WHERE project_id = ? ORDER BY created_at ASC', [id]);

    res.json({
      project,
      hiredFreelancer,
      milestones
    });
  } catch (error) {
    console.error('Fetch project details error:', error);
    res.status(500).json({ error: 'Database error fetching project details.' });
  }
}

// Add Milestone (Client only)
async function addMilestone(req, res) {
  try {
    const { projectId, title, description, amount } = req.body;
    if (!projectId || !title || !amount) {
      return res.status(400).json({ error: 'Please provide projectId, title, and amount.' });
    }

    const pool = await getPool();
    // Validate project ownership
    const [projects] = await pool.query('SELECT client_id, title FROM projects WHERE id = ?', [projectId]);
    if (projects.length === 0) return res.status(404).json({ error: 'Project not found.' });
    if (projects[0].client_id !== req.user.id) return res.status(403).json({ error: 'Unauthorized.' });

    const [result] = await pool.query(
      'INSERT INTO milestones (project_id, title, description, amount, status) VALUES (?, ?, ?, ?, "pending")',
      [projectId, title, description || null, amount]
    );

    // Notify freelancer if hired
    const [hired] = await pool.query('SELECT freelancer_id FROM bids WHERE project_id = ? AND status = "accepted"', [projectId]);
    if (hired.length > 0) {
      await createNotification(
        hired[0].freelancer_id,
        `A new milestone "${title}" ($${amount}) has been created for project "${projects[0].title}".`,
        'milestone_created',
        req.app
      );
    }

    res.status(201).json({
      message: 'Milestone created successfully.',
      milestoneId: result.insertId
    });
  } catch (error) {
    console.error('Add milestone error:', error);
    res.status(500).json({ error: 'Database error creating milestone.' });
  }
}

// Update Milestone Status
async function updateMilestoneStatus(req, res) {
  try {
    const { milestoneId, status } = req.body; // status: 'funded' or 'released'
    if (!milestoneId || !status) {
      return res.status(400).json({ error: 'Please provide milestoneId and status.' });
    }

    const pool = await getPool();
    const [milestones] = await pool.query('SELECT * FROM milestones WHERE id = ?', [milestoneId]);
    if (milestones.length === 0) return res.status(404).json({ error: 'Milestone not found.' });

    const milestone = milestones[0];
    const [projects] = await pool.query('SELECT client_id, title FROM projects WHERE id = ?', [milestone.project_id]);
    const project = projects[0];

    const [hired] = await pool.query('SELECT freelancer_id FROM bids WHERE project_id = ? AND status = "accepted"', [milestone.project_id]);
    if (hired.length === 0) return res.status(400).json({ error: 'No freelancer is currently hired for this project.' });
    const freelancerId = hired[0].freelancer_id;

    if (status === 'funded') {
      if (project.client_id !== req.user.id) return res.status(403).json({ error: 'Only the client can fund this milestone.' });
      await pool.query('UPDATE milestones SET status = "funded" WHERE id = ?', [milestoneId]);
      await createNotification(freelancerId, `Milestone "${milestone.title}" has been funded by the client.`, 'milestone_update', req.app);
    } else if (status === 'released') {
      if (project.client_id !== req.user.id) return res.status(403).json({ error: 'Only the client can release funds.' });
      await pool.query('UPDATE milestones SET status = "released" WHERE id = ?', [milestoneId]);
      
      // Transfer money to Freelancer's wallet
      await pool.query('UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?', [milestone.amount, freelancerId]);
      
      // Also write to payments table log
      await pool.query(
        'INSERT INTO payments (project_id, client_id, freelancer_id, amount, payment_status) VALUES (?, ?, ?, ?, "completed")',
        [milestone.project_id, project.client_id, freelancerId, milestone.amount]
      );

      await createNotification(freelancerId, `Milestone "${milestone.title}" ($${milestone.amount}) has been released to your wallet!`, 'milestone_update', req.app);
    } else {
      return res.status(400).json({ error: 'Invalid status update.' });
    }

    res.json({ message: `Milestone status successfully updated to ${status}.` });
  } catch (error) {
    console.error('Update milestone status error:', error);
    res.status(500).json({ error: 'Database error updating milestone.' });
  }
}

module.exports = {
  createProject,
  getProjects,
  updateProject,
  deleteProject,
  getMyProjects,
  getProjectById,
  addMilestone,
  updateMilestoneStatus
};
