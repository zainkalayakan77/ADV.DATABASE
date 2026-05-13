// Authentication middleware
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

// Verify JWT token
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        
        // Verify user still exists in database
        const [users] = await pool.execute(
            'SELECT user_id, name, email FROM Users WHERE user_id = ?',
            [decoded.userId]
        );

        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid token - user not found' });
        }

        req.user = users[0];
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
};

// Check if user is teacher in specific class
const requireTeacherRole = async (req, res, next) => {
    try {
        const classId = req.params.classId || req.body.classId;
        const userId = req.user.user_id;

        const [enrollments] = await pool.execute(
            'SELECT role FROM Enrollments WHERE user_id = ? AND class_id = ? AND role = "Teacher"',
            [userId, classId]
        );

        if (enrollments.length === 0) {
            return res.status(403).json({ error: 'Teacher access required for this class' });
        }

        next();
    } catch (error) {
        console.error('Role check error:', error);
        res.status(500).json({ error: 'Server error during role verification' });
    }
};

// Check if user is enrolled in class (Teacher or Student) and has Active status
const requireClassAccess = async (req, res, next) => {
    try {
        const classId = req.params.classId || req.body.classId;
        const userId = req.user.user_id;

        const [enrollments] = await pool.execute(
            'SELECT role FROM Enrollments WHERE user_id = ? AND class_id = ? AND status = "Active"',
            [userId, classId]
        );

        if (enrollments.length === 0) {
            return res.status(403).json({ error: 'Access denied - not enrolled in this class or access has been revoked' });
        }

        req.userRole = enrollments[0].role;
        next();
    } catch (error) {
        console.error('Class access check error:', error);
        res.status(500).json({ error: 'Server error during access verification' });
    }
};

module.exports = {
    authenticateToken,
    requireTeacherRole,
    requireClassAccess
};