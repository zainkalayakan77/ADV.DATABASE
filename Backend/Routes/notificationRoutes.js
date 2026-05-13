// Notification Routes
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
    getUserNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification
} = require('../Controllers/notificationController');

// All routes require authentication
router.use(authenticateToken);

// Notification routes
router.get('/', getUserNotifications);                          // Get user notifications
router.get('/unread-count', getUnreadCount);                   // Get unread count
router.put('/:notificationId/read', markAsRead);               // Mark as read
router.put('/mark-all-read', markAllAsRead);                   // Mark all as read
router.delete('/:notificationId', deleteNotification);         // Delete notification

module.exports = router;