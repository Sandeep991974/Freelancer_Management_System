const { getPool } = require('../config/db');

// Fetch Chat History for a Project
async function getChatHistory(req, res) {
  try {
    const { projectId } = req.params;
    const pool = await getPool();

    // Verify user is authorized to view this chat (either the client or the freelancer of the project)
    const [projects] = await pool.query('SELECT client_id FROM projects WHERE id = ?', [projectId]);
    if (projects.length === 0) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    const client_id = projects[0].client_id;

    // Fetch accepted freelancer (hired) or anyone who bid if project is open
    const [hired] = await pool.query(
      'SELECT freelancer_id FROM bids WHERE project_id = ? AND status = "accepted"',
      [projectId]
    );
    const hiredFreelancerId = hired.length > 0 ? hired[0].freelancer_id : null;

    // Check if requester is client, or hired freelancer, or has active bid
    const isAuthorized = req.user.id === client_id || 
                         req.user.id === hiredFreelancerId ||
                         (await checkIfHasBid(req.user.id, projectId));

    if (!isAuthorized) {
      return res.status(403).json({ error: 'You are not authorized to access this chat.' });
    }

    // Fetch messages
    const [messages] = await pool.query(`
      SELECT m.*, u.name as sender_name, u.role as sender_role
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.project_id = ?
      ORDER BY m.created_at ASC
    `, [projectId]);

    res.json(messages);
  } catch (error) {
    console.error('Fetch chat history error:', error);
    res.status(500).json({ error: 'Database error fetching chat history.' });
  }
}

// Send Chat Message (Supports file upload attachment)
async function sendMessage(req, res) {
  try {
    const { projectId } = req.params;
    const { message_text, receiver_id } = req.body;
    const senderId = req.user.id;
    let fileUrl = null;

    if (req.file) {
      // Relative URL path to serve the file
      fileUrl = `/uploads/${req.file.filename}`;
    }

    if (!message_text && !fileUrl) {
      return res.status(400).json({ error: 'Cannot send an empty message.' });
    }

    if (!receiver_id) {
      return res.status(400).json({ error: 'Please specify the receiver_id.' });
    }

    const pool = await getPool();

    // Save message to database
    const [result] = await pool.query(
      'INSERT INTO messages (project_id, sender_id, receiver_id, message_text, file_url) VALUES (?, ?, ?, ?, ?)',
      [projectId, senderId, receiver_id, message_text || '', fileUrl]
    );

    const messageId = result.insertId;

    // Query back the newly created message with sender name details
    const [messages] = await pool.query(`
      SELECT m.*, u.name as sender_name, u.role as sender_role
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.id = ?
    `, [messageId]);

    const newMessage = messages[0];

    // Emit Socket.IO message event in real-time
    const io = req.app.get('io');
    if (io) {
      const roomName = `project_${projectId}`;
      console.log(`Broadcasting new message to Socket.IO room: ${roomName}`);
      io.to(roomName).emit('receive_message', newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Database error sending message.' });
  }
}

// Helper to check if freelancer has a bid on the project
async function checkIfHasBid(userId, projectId) {
  const pool = await getPool();
  const [bids] = await pool.query(
    'SELECT id FROM bids WHERE project_id = ? AND freelancer_id = ?',
    [projectId, userId]
  );
  return bids.length > 0;
}

module.exports = {
  getChatHistory,
  sendMessage
};
