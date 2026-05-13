// Announcement Routes
const express = require('express');
const router = express.Router();
const { authenticateToken, requireTeacherRole } = require('../middleware/auth');
const {
    createAnnouncement,
    getClassAnnouncements,
    deleteAnnouncement
} = require('../Controllers/announcementController');

// All routes require authentication
router.use(authenticateToken);

// Announcement routes
router.post('/class/:classId', createAnnouncement);              // Create announcement (teacher only - checked in controller)
router.get('/class/:classId', getClassAnnouncements);            // Get class announcements
router.delete('/:announcementId', deleteAnnouncement);           // Delete announcement (author/teacher only - checked in controller)

module.exports = router;
