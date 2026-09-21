const { getPool } = require('../config/db');

// Get all notifications for user
async function getNotifications(req, res) {
  try {
    const pool = await getPool();
    const [notifications] = await pool.query(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
      [req.user.id]
    );
    res.json(notifications);
  } catch (error) {
    console.error('Fetch notifications error:', error);
    res.status(500).json({ error: 'Database error fetching notifications.' });
  }
}

// Mark notifications as read
async function markRead(req, res) {
  try {
    const pool = await getPool();
    await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = ?',
      [req.user.id]
    );
    res.json({ message: 'Notifications marked as read.' });
  } catch (error) {
    console.error('Mark read notifications error:', error);
    res.status(500).json({ error: 'Database error marking notifications read.' });
  }
}

// Helper function to create and send real-time notification
async function createNotification(userId, message, type = 'general', app = null) {
  try {
    const pool = await getPool();
    await pool.query(
      'INSERT INTO notifications (user_id, message, type, is_read) VALUES (?, ?, ?, FALSE)',
      [userId, message, type]
    );

    if (app) {
      const io = app.get('io');
      if (io) {
        // Emit specifically to user's channel/room
        io.emit(`notification_${userId}`, { message, type, created_at: new Date() });
      }
    }
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
}

module.exports = {
  getNotifications,
  markRead,
  createNotification
};
