const { getPool } = require('../config/db');
const { createNotification } = require('./notificationController');

// Get overview stats
async function getOverview(req, res) {
  try {
    const pool = await getPool();
    const [[users]] = await pool.query('SELECT COUNT(*) as count FROM users');
    const [[clients]] = await pool.query('SELECT COUNT(*) as count FROM users WHERE role = "client"');
    const [[freelancers]] = await pool.query('SELECT COUNT(*) as count FROM users WHERE role = "freelancer"');
    const [[projects]] = await pool.query('SELECT COUNT(*) as count FROM projects');
    const [[bids]] = await pool.query('SELECT COUNT(*) as count FROM bids');
    const [[payments]] = await pool.query('SELECT SUM(amount) as total FROM payments WHERE payment_status = "completed"');

    res.json({
      totalUsers: users.count,
      totalClients: clients.count,
      totalFreelancers: freelancers.count,
      totalProjects: projects.count,
      totalBids: bids.count,
      totalPayments: payments.total || 0
    });
  } catch (error) {
    console.error('Admin overview error:', error);
    res.status(500).json({ error: 'Database error fetching overview.' });
  }
}

// Get all users with detail
async function getAllUsers(req, res) {
  try {
    const pool = await getPool();
    const [users] = await pool.query('SELECT id, name, email, role, is_blocked, is_verified, created_at FROM users ORDER BY created_at DESC');
    res.json(users);
  } catch (error) {
    console.error('Admin get users error:', error);
    res.status(500).json({ error: 'Database error fetching users.' });
  }
}

// Toggle Block status
async function toggleBlockUser(req, res) {
  try {
    const { id } = req.params;
    const { block } = req.body;
    const pool = await getPool();
    await pool.query('UPDATE users SET is_blocked = ? WHERE id = ?', [block ? 1 : 0, id]);
    res.json({ message: `User status updated to ${block ? 'Blocked' : 'Active'}.` });
  } catch (error) {
    console.error('Admin block user error:', error);
    res.status(500).json({ error: 'Database error updating user status.' });
  }
}

// Verify account status
async function verifyUserAccount(req, res) {
  try {
    const { id } = req.params;
    const { verify } = req.body;
    const pool = await getPool();
    await pool.query('UPDATE users SET is_verified = ? WHERE id = ?', [verify ? 1 : 0, id]);
    res.json({ message: `User account verification status set to ${verify ? 'Verified' : 'Unverified'}.` });
  } catch (error) {
    console.error('Admin verify user error:', error);
    res.status(500).json({ error: 'Database error verifying user account.' });
  }
}

// Change user role
async function updateUserRole(req, res) {
  try {
    const { id } = req.params;
    const { role } = req.body;
    if (!role || !['client', 'freelancer', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Please provide a valid role.' });
    }

    const pool = await getPool();
    const [users] = await pool.query('SELECT id, role FROM users WHERE id = ?', [id]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const [admins] = await pool.query("SELECT COUNT(*) as count FROM users WHERE role = 'admin'");
    if (users[0].role === 'admin' && role !== 'admin' && admins[0].count <= 1) {
      return res.status(400).json({ error: 'At least one admin account must remain.' });
    }

    await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, id]);
    res.json({ message: 'User role updated successfully.' });
  } catch (error) {
    console.error('Admin update role error:', error);
    res.status(500).json({ error: 'Database error updating user role.' });
  }
}

// Delete user
async function deleteUser(req, res) {
  try {
    const { id } = req.params;
    const pool = await getPool();
    await pool.query('DELETE FROM users WHERE id = ?', [id]);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Admin delete user error:', error);
    res.status(500).json({ error: 'Database error deleting user.' });
  }
}

// Get all projects
async function getAllProjects(req, res) {
  try {
    const pool = await getPool();
    const [projects] = await pool.query(`
      SELECT p.id, p.title, p.status, p.budget, p.created_at, u.name as client_name
      FROM projects p
      JOIN users u ON p.client_id = u.id
      ORDER BY p.created_at DESC
    `);
    res.json(projects);
  } catch (error) {
    console.error('Admin get projects error:', error);
    res.status(500).json({ error: 'Database error fetching projects.' });
  }
}

// Delete project
async function deleteProject(req, res) {
  try {
    const { id } = req.params;
    const pool = await getPool();
    await pool.query('DELETE FROM projects WHERE id = ?', [id]);
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Admin delete project error:', error);
    res.status(500).json({ error: 'Database error deleting project.' });
  }
}

// Update project status
async function updateProjectStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const allowedStatuses = ['open', 'in_progress', 'completed', 'cancelled', 'paused'];

    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({ error: 'Please provide a valid project status.' });
    }

    const pool = await getPool();
    const [projects] = await pool.query('SELECT id FROM projects WHERE id = ?', [id]);
    if (projects.length === 0) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    await pool.query('UPDATE projects SET status = ? WHERE id = ?', [status, id]);
    res.json({ message: 'Project status updated successfully.' });
  } catch (error) {
    console.error('Admin update project status error:', error);
    res.status(500).json({ error: 'Database error updating project status.' });
  }
}

// Get Withdrawals
async function getWithdrawals(req, res) {
  try {
    const pool = await getPool();
    const [withdrawals] = await pool.query(`
      SELECT w.*, u.name as freelancer_name, u.email as freelancer_email
      FROM withdrawals w
      JOIN users u ON w.freelancer_id = u.id
      ORDER BY w.created_at DESC
    `);
    res.json(withdrawals);
  } catch (error) {
    console.error('Admin get withdrawals error:', error);
    res.status(500).json({ error: 'Database error fetching withdrawals.' });
  }
}

// Approve/Reject Withdrawal
async function processWithdrawal(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'approved' or 'rejected'
    const pool = await getPool();

    const [withdrawals] = await pool.query('SELECT * FROM withdrawals WHERE id = ?', [id]);
    if (withdrawals.length === 0) return res.status(404).json({ error: 'Withdrawal request not found.' });

    const withdrawal = withdrawals[0];
    if (withdrawal.status !== 'pending') return res.status(400).json({ error: 'Withdrawal request already processed.' });

    if (status === 'approved') {
      await pool.query('UPDATE withdrawals SET status = "approved" WHERE id = ?', [id]);
      await createNotification(withdrawal.freelancer_id, `Your withdrawal request of $${withdrawal.amount} has been approved and dispatched.`, 'withdrawal_update', req.app);
    } else {
      await pool.query('UPDATE withdrawals SET status = "rejected" WHERE id = ?', [id]);
      // Return money back to user's wallet balance
      await pool.query('UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?', [withdrawal.amount, withdrawal.freelancer_id]);
      await createNotification(withdrawal.freelancer_id, `Your withdrawal request of $${withdrawal.amount} was rejected. Funds returned to your wallet.`, 'withdrawal_update', req.app);
    }

    res.json({ message: `Withdrawal request successfully ${status}.` });
  } catch (error) {
    console.error('Admin process withdrawal error:', error);
    res.status(500).json({ error: 'Database error processing withdrawal.' });
  }
}

// Get Reports
async function getReports(req, res) {
  try {
    const pool = await getPool();
    const [reports] = await pool.query(`
      SELECT r.*, u.name as reporter_name
      FROM reports r
      JOIN users u ON r.reporter_id = u.id
      ORDER BY r.created_at DESC
    `);
    res.json(reports);
  } catch (error) {
    console.error('Admin get reports error:', error);
    res.status(500).json({ error: 'Database error fetching reports.' });
  }
}

// Submit Report (Client or Freelancer)
async function submitReport(req, res) {
  try {
    const { targetType, targetId, reason } = req.body;
    if (!targetType || !targetId || !reason) {
      return res.status(400).json({ error: 'Please provide targetType, targetId, and reason.' });
    }

    const pool = await getPool();
    await pool.query(
      'INSERT INTO reports (reporter_id, target_type, target_id, reason, status) VALUES (?, ?, ?, ?, "pending")',
      [req.user.id, targetType, targetId, reason]
    );

    res.json({ message: 'Report submitted successfully. Admin will review shortly.' });
  } catch (error) {
    console.error('Submit report error:', error);
    res.status(500).json({ error: 'Database error submitting report.' });
  }
}

// Resolve Report
async function resolveReport(req, res) {
  try {
    const { id } = req.params;
    const pool = await getPool();
    await pool.query('UPDATE reports SET status = "resolved" WHERE id = ?', [id]);
    res.json({ message: 'Report marked as resolved.' });
  } catch (error) {
    console.error('Resolve report error:', error);
    res.status(500).json({ error: 'Database error resolving report.' });
  }
}

// Get CMS Content
async function getCms(req, res) {
  try {
    const pool = await getPool();
    const [cms] = await pool.query('SELECT * FROM cms_content');
    res.json(cms);
  } catch (error) {
    console.error('Admin get CMS error:', error);
    res.status(500).json({ error: 'Database error fetching CMS.' });
  }
}

// Set/Update CMS Content
async function updateCms(req, res) {
  try {
    const { content_key, content_value } = req.body;
    if (!content_key || !content_value) {
      return res.status(400).json({ error: 'Please provide content_key and content_value.' });
    }

    const pool = await getPool();
    await pool.query(
      'INSERT INTO cms_content (content_key, content_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE content_value = ?',
      [content_key, content_value, content_value]
    );

    res.json({ message: 'CMS Content saved successfully.' });
  } catch (error) {
    console.error('Admin update CMS error:', error);
    res.status(500).json({ error: 'Database error updating CMS content.' });
  }
}

// Broadcast Notification
async function broadcast(req, res) {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Please provide a message.' });

    const pool = await getPool();
    const [users] = await pool.query('SELECT id FROM users');
    for (const u of users) {
      await createNotification(u.id, message, 'broadcast', req.app);
    }

    res.json({ message: 'Broadcast notification dispatched successfully.' });
  } catch (error) {
    console.error('Broadcast notification error:', error);
    res.status(500).json({ error: 'Database error broadcasting notification.' });
  }
}

module.exports = {
  getOverview,
  getAllUsers,
  toggleBlockUser,
  verifyUserAccount,
  deleteUser,
  getAllProjects,
  deleteProject,
  updateProjectStatus,
  getWithdrawals,
  processWithdrawal,
  getReports,
  submitReport,
  resolveReport,
  getCms,
  updateCms,
  broadcast,
  updateUserRole
};
