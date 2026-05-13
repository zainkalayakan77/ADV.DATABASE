// Announcement Controller - Handles room announcements
const { pool } = require('../config/database');

// Create announcement (Teacher only)
const createAnnouncement = async (req, res) => {
    try {
        const { classId } = req.params;
        const { content } = req.body;
        const userId = req.user.user_id;

        // Input validation
        if (!content || content.trim().length === 0) {
            return res.status(400).json({ error: 'Announcement content is required' });
        }

        if (content.length > 5000) {
            return res.status(400).json({ error: 'Announcement content is too long (max 5000 characters)' });
        }

        // Verify user is a teacher in this class
        const [teacherCheck] = await pool.execute(
            'SELECT role FROM Enrollments WHERE user_id = ? AND class_id = ? AND role = "Teacher" AND status = "Active"',
            [userId, classId]
        );

        if (teacherCheck.length === 0) {
            return res.status(403).json({ error: 'Only teachers can post announcements' });
        }

        // Insert announcement
        const [result] = await pool.execute(
            'INSERT INTO Announcements (class_id, user_id, content) VALUES (?, ?, ?)',
            [classId, userId, content.trim()]
        );

        const announcementId = result.insertId;

        // Get announcement with user info
        const [announcement] = await pool.execute(`
            SELECT a.announcement_id, a.content, a.created_at,
                   u.name as author_name
            FROM Announcements a
            JOIN Users u ON a.user_id = u.user_id
            WHERE a.announcement_id = ?
        `, [announcementId]);

        res.status(201).json({
            message: 'Announcement posted successfully',
            announcement: announcement[0]
        });

    } catch (error) {
        console.error('Create announcement error:', error);
        res.status(500).json({ error: 'Server error creating announcement' });
    }
};

// Get announcements for a class
const getClassAnnouncements = async (req, res) => {
    try {
        const { classId } = req.params;
        const userId = req.user.user_id;

        // Verify user has access to this class
        const [userAccess] = await pool.execute(
            'SELECT role FROM Enrollments WHERE user_id = ? AND class_id = ? AND status = "Active"',
            [userId, classId]
        );

        if (userAccess.length === 0) {
            return res.status(403).json({ error: 'Access denied to this class' });
        }

        const userRole = userAccess[0].role;

        // Get announcements with author info
        const [announcements] = await pool.execute(`
            SELECT a.announcement_id, a.content, a.created_at,
                   u.user_id as author_id, u.name as author_name
            FROM Announcements a
            JOIN Users u ON a.user_id = u.user_id
            WHERE a.class_id = ?
            ORDER BY a.created_at DESC
            LIMIT 50
        `, [classId]);

        res.json({
            announcements,
            user_role: userRole,
            can_post: userRole === 'Teacher'
        });

    } catch (error) {
        console.error('Get announcements error:', error);
        res.status(500).json({ error: 'Server error fetching announcements' });
    }
};

// Delete announcement (Teacher who created it only)
const deleteAnnouncement = async (req, res) => {
    try {
        const { announcementId } = req.params;
        const userId = req.user.user_id;

        // Get announcement details
        const [announcements] = await pool.execute(
            'SELECT user_id, class_id FROM Announcements WHERE announcement_id = ?',
            [announcementId]
        );

        if (announcements.length === 0) {
            return res.status(404).json({ error: 'Announcement not found' });
        }

        const announcement = announcements[0];

        // Verify user is the author or a teacher in the class
        const [teacherCheck] = await pool.execute(
            'SELECT role FROM Enrollments WHERE user_id = ? AND class_id = ? AND role = "Teacher" AND status = "Active"',
            [userId, announcement.class_id]
        );

        if (teacherCheck.length === 0 && announcement.user_id !== userId) {
            return res.status(403).json({ error: 'Only the author or class teachers can delete announcements' });
        }

        // Delete announcement
        await pool.execute(
            'DELETE FROM Announcements WHERE announcement_id = ?',
            [announcementId]
        );

        res.json({ message: 'Announcement deleted successfully' });

    } catch (error) {
        console.error('Delete announcement error:', error);
        res.status(500).json({ error: 'Server error deleting announcement' });
    }
};

module.exports = {
    createAnnouncement,
    getClassAnnouncements,
    deleteAnnouncement
};
