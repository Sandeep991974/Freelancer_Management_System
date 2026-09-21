const { getPool } = require('../config/db');
const { createNotification } = require('./notificationController');

// Get Wallet Balance & Transaction History
async function getWallet(req, res) {
  try {
    const pool = await getPool();
    const userId = req.user.id;

    // Fetch user details (specifically balance)
    const [users] = await pool.query('SELECT wallet_balance FROM users WHERE id = ?', [userId]);
    if (users.length === 0) return res.status(404).json({ error: 'User not found.' });

    const balance = users[0].wallet_balance;

    // Fetch payments log
    let query = '';
    let params = [];
    if (req.user.role === 'freelancer') {
      query = 'SELECT * FROM payments WHERE freelancer_id = ? ORDER BY created_at DESC';
      params = [userId];
    } else {
      query = 'SELECT * FROM payments WHERE client_id = ? ORDER BY created_at DESC';
      params = [userId];
    }
    const [payments] = await pool.query(query, params);

    // Fetch withdrawals
    const [withdrawals] = await pool.query(
      'SELECT * FROM withdrawals WHERE freelancer_id = ? ORDER BY created_at DESC',
      [userId]
    );

    res.json({
      balance,
      payments,
      withdrawals
    });
  } catch (error) {
    console.error('Get wallet error:', error);
    res.status(500).json({ error: 'Database error fetching wallet info.' });
  }
}

// Deposit Funds (Client simulated)
async function depositFunds(req, res) {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Please provide a valid deposit amount.' });
    }

    const pool = await getPool();
    await pool.query('UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?', [amount, req.user.id]);

    // Add log in payments table (represented with negative project_id or null to show general deposit)
    await pool.query(
      'INSERT INTO payments (project_id, client_id, freelancer_id, amount, payment_status) VALUES (0, ?, 0, ?, "completed")',
      [req.user.id, amount]
    );

    res.json({ message: 'Funds deposited successfully!' });
  } catch (error) {
    console.error('Deposit funds error:', error);
    res.status(500).json({ error: 'Database error during deposit.' });
  }
}

// Withdrawal Request (Freelancer only)
async function withdrawRequest(req, res) {
  try {
    const { amount, bankDetails } = req.body;
    if (!amount || amount <= 0 || !bankDetails) {
      return res.status(400).json({ error: 'Please provide withdrawal amount and bank/account details.' });
    }

    const pool = await getPool();
    const [users] = await pool.query('SELECT wallet_balance FROM users WHERE id = ?', [req.user.id]);
    const balance = users[0].wallet_balance;

    if (balance < amount) {
      return res.status(400).json({ error: 'Insufficient wallet balance.' });
    }

    // Deduct from balance immediately to lock funds
    await pool.query('UPDATE users SET wallet_balance = wallet_balance - ? WHERE id = ?', [amount, req.user.id]);

    // Insert withdrawal entry
    await pool.query(
      'INSERT INTO withdrawals (freelancer_id, amount, bank_details, status) VALUES (?, ?, ?, "pending")',
      [req.user.id, amount, bankDetails]
    );

    res.json({ message: 'Withdrawal request submitted successfully. Awaiting admin approval.' });
  } catch (error) {
    console.error('Withdraw request error:', error);
    res.status(500).json({ error: 'Database error creating withdrawal request.' });
  }
}

// Release Escrow Payment (Client only)
async function releasePayment(req, res) {
  try {
    const { projectId } = req.params;
    const clientId = req.user.id;
    const pool = await getPool();

    const [projects] = await pool.query('SELECT client_id, title FROM projects WHERE id = ?', [projectId]);
    if (projects.length === 0) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    const project = projects[0];
    if (project.client_id !== clientId) {
      return res.status(403).json({ error: 'Only the project client can release payments.' });
    }

    const [payments] = await pool.query(
      'SELECT id, amount, freelancer_id, payment_status FROM payments WHERE project_id = ? AND client_id = ? AND payment_status = "pending"',
      [projectId, clientId]
    );

    if (payments.length === 0) {
      return res.status(400).json({ error: 'No pending escrow payments found for this project.' });
    }

    const pay = payments[0];

    // Release the payment (update payment status to 'completed')
    await pool.query('UPDATE payments SET payment_status = "completed" WHERE id = ?', [pay.id]);

    // Transfer money to Freelancer's wallet balance
    await pool.query('UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?', [pay.amount, pay.freelancer_id]);

    // Update project status to completed if appropriate
    await pool.query('UPDATE projects SET status = "completed" WHERE id = ?', [projectId]);

    await createNotification(
      pay.freelancer_id,
      `Escrow payment of $${pay.amount} for "${project.title}" has been released to your wallet!`,
      'payment_received',
      req.app
    );

    res.json({
      message: 'Escrow payment released successfully. Funds transferred to freelancer.',
      paymentStatus: 'completed'
    });
  } catch (error) {
    console.error('Release payment error:', error);
    res.status(500).json({ error: 'Database error releasing payment.' });
  }
}

// Get Payment Details for a Project
async function getPaymentDetails(req, res) {
  try {
    const { projectId } = req.params;
    const pool = await getPool();

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

    if (req.user.id !== client_id && req.user.id !== freelancer_id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You are not authorized to view payments for this project.' });
    }

    const [payments] = await pool.query(
      'SELECT id, amount, payment_status, created_at FROM payments WHERE project_id = ?',
      [projectId]
    );

    res.json(payments.length > 0 ? payments[0] : null);
  } catch (error) {
    console.error('Fetch payment details error:', error);
    res.status(500).json({ error: 'Database error fetching payment details.' });
  }
}

module.exports = {
  getWallet,
  depositFunds,
  withdrawRequest,
  releasePayment,
  getPaymentDetails
};
