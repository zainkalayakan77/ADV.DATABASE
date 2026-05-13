// Notification Controller - Handles notification system
const { pool } = require('../config/database');

// Get user notifications
const getUserNotifications = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { type, limit = 50 } = req.query;

        let whereClause = 'WHERE user_id = ?';
        let params = [userId];

        if (type && type !== 'all') {
            whereClause += ' AND type = ?';
            params.push(type);
        }

        const [notifications] = await pool.execute(`
            SELECT notification_id, type, title, message, related_id, is_read, created_at
            FROM Notifications
            ${whereClause}
            ORDER BY created_at DESC
            LIMIT ?
        `, [...params, parseInt(limit)]);

        res.json({ notifications });

    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ error: 'Server error fetching notifications' });
    }
};

// Get unread notification count
const getUnreadCount = async (req, res) => {
    try {
        const userId = req.user.user_id;

        const [result] = await pool.execute(
            'SELECT COUNT(*) as unread_count FROM Notifications WHERE user_id = ? AND is_read = FALSE',
            [userId]
        );

        res.json({ unread_count: result[0].unread_count });

    } catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({ error: 'Server error fetching unread count' });
    }
};

// Mark notification as read
const markAsRead = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const userId = req.user.user_id;

        const [result] = await pool.execute(
            'UPDATE Notifications SET is_read = TRUE WHERE notification_id = ? AND user_id = ?',
            [notificationId, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        res.json({ message: 'Notification marked as read' });

    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({ error: 'Server error marking notification as read' });
    }
};

// Mark all notifications as read
const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.user_id;

        await pool.execute(
            'UPDATE Notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE',
            [userId]
        );

        res.json({ message: 'All notifications marked as read' });

    } catch (error) {
        console.error('Mark all as read error:', error);
        res.status(500).json({ error: 'Server error marking all notifications as read' });
    }
};

// Delete notification
const deleteNotification = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const userId = req.user.user_id;

        const [result] = await pool.execute(
            'DELETE FROM Notifications WHERE notification_id = ? AND user_id = ?',
            [notificationId, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        res.json({ message: 'Notification deleted successfully' });

    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({ error: 'Server error deleting notification' });
    }
};

// Create notification (internal function)
const createNotification = async (userId, type, title, message, relatedId = null) => {
    try {
        await pool.execute(
            'INSERT INTO Notifications (user_id, type, title, message, related_id) VALUES (?, ?, ?, ?, ?)',
            [userId, type, title, message, relatedId]
        );
    } catch (error) {
        console.error('Create notification error:', error);
    }
};

module.exports = {
    getUserNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification
};