// Class Management Controller - Handles class creation, joining, and management
const { pool } = require('../config/database');

// Generate unique class code
const generateClassCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

// Create new class (Teacher only)
const createClass = async (req, res) => {
    try {
        const { class_name, description } = req.body;
        const userId = req.user.user_id;

        // Input validation
        if (!class_name) {
            return res.status(400).json({ error: 'Class name is required' });
        }

        // Generate unique class code
        let classCode;
        let isUnique = false;
        let attempts = 0;

        while (!isUnique && attempts < 10) {
            classCode = generateClassCode();
            const [existing] = await pool.execute(
                'SELECT class_code FROM Classes WHERE class_code = ?',
                [classCode]
            );
            isUnique = existing.length === 0;
            attempts++;
        }

        if (!isUnique) {
            return res.status(500).json({ error: 'Unable to generate unique class code' });
        }

        // Start transaction
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // Insert class
            const [classResult] = await connection.execute(
                'INSERT INTO Classes (class_name, class_code, description, created_by) VALUES (?, ?, ?, ?)',
                [class_name, classCode, description || null, userId]
            );

            // Automatically enroll creator as Teacher
            await connection.execute(
                'INSERT INTO Enrollments (user_id, class_id, role) VALUES (?, ?, "Teacher")',
                [userId, classResult.insertId]
            );

            await connection.commit();
            connection.release();

            res.status(201).json({
                message: 'Class created successfully',
                class: {
                    id: classResult.insertId,
                    name: class_name,
                    code: classCode,
                    description: description
                }
            });

        } catch (error) {
            await connection.rollback();
            connection.release();
            throw error;
        }

    } catch (error) {
        console.error('Class creation error:', error);
        res.status(500).json({ error: 'Server error creating class' });
    }
};

// Join class via code with kicked user handling
const joinClass = async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        const { class_code } = req.body;
        const userId = req.user.user_id;

        // Input validation
        if (!class_code) {
            connection.release();
            return res.status(400).json({ error: 'Class code is required' });
        }

        // Validate class code format (6 alphanumeric characters)
        const cleanClassCode = class_code.trim().toUpperCase();
        if (!/^[A-Z0-9]{6}$/.test(cleanClassCode)) {
            connection.release();
            return res.status(400).json({ error: 'Invalid class code format' });
        }

        // Start transaction for data consistency
        await connection.beginTransaction();

        // Find class by code with FOR UPDATE lock to prevent race conditions
        const [classes] = await connection.execute(
            'SELECT class_id, class_name, status, created_by FROM Classes WHERE class_code = ? FOR UPDATE',
            [cleanClassCode]
        );

        if (classes.length === 0) {
            await connection.rollback();
            connection.release();
            return res.status(404).json({ error: 'Invalid class code' });
        }

        const classInfo = classes[0];

        // Prevent joining your own class as a student
        if (classInfo.created_by === userId) {
            await connection.rollback();
            connection.release();
            return res.status(400).json({ 
                error: 'You are the creator of this class',
                message: 'Class creators are automatically enrolled as teachers'
            });
        }

        // Check if class is archived
        if (classInfo.status === 'Archived') {
            await connection.rollback();
            connection.release();
            return res.status(403).json({ 
                error: 'This class is archived and not accepting new members',
                archived: true
            });
        }

        // Check enrollment status with lock
        const [existingEnrollment] = await connection.execute(
            'SELECT enrollment_id, status, role FROM Enrollments WHERE user_id = ? AND class_id = ? FOR UPDATE',
            [userId, classInfo.class_id]
        );

        if (existingEnrollment.length > 0) {
            const enrollment = existingEnrollment[0];
            
            if (enrollment.status === 'Active') {
                await connection.rollback();
                connection.release();
                return res.status(409).json({ 
                    error: 'Already enrolled in this class',
                    role: enrollment.role
                });
            } else if (enrollment.status === 'Kicked') {
                // User was kicked - they need to request re-entry
                await connection.rollback();
                connection.release();
                return res.status(403).json({ 
                    error: 'You were removed from this class. You need to request re-entry.',
                    kicked: true,
                    class_id: classInfo.class_id,
                    class_name: classInfo.class_name
                });
            } else if (enrollment.status === 'Pending') {
                // Already has a pending request
                await connection.rollback();
                connection.release();
                return res.status(409).json({ 
                    error: 'You already have a pending request for this class',
                    pending: true
                });
            }
        }

        // Verify user exists and is valid
        const [userCheck] = await connection.execute(
            'SELECT user_id, name FROM Users WHERE user_id = ?',
            [userId]
        );

        if (userCheck.length === 0) {
            await connection.rollback();
            connection.release();
            return res.status(401).json({ error: 'Invalid user session' });
        }

        // Enroll as Student (new enrollment) - DO NOT create submissions yet
        const [enrollResult] = await connection.execute(
            'INSERT INTO Enrollments (user_id, class_id, role, status, enrolled_at) VALUES (?, ?, ?, ?, NOW())',
            [userId, classInfo.class_id, 'Student', 'Active']
        );

        // Verify the enrollment was created
        if (enrollResult.affectedRows === 0) {
            await connection.rollback();
            connection.release();
            return res.status(500).json({ error: 'Failed to create enrollment' });
        }

        // Commit transaction
        await connection.commit();
        connection.release();

        // Log successful join
        console.log(`User ${userId} (${userCheck[0].name}) successfully joined class ${classInfo.class_id} (${classInfo.class_name})`);

        res.json({
            message: 'Successfully joined class',
            class: {
                id: classInfo.class_id,
                name: classInfo.class_name,
                role: 'Student'
            }
        });

    } catch (error) {
        // Rollback transaction on any error
        try {
            await connection.rollback();
        } catch (rollbackError) {
            console.error('Rollback error:', rollbackError);
        }
        connection.release();

        console.error('Join class error:', error);
        console.error('Error details:', {
            code: error.code,
            errno: error.errno,
            sqlMessage: error.sqlMessage,
            sqlState: error.sqlState
        });
        
        // Handle specific database errors
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ 
                error: 'You are already enrolled in this class',
                duplicate: true
            });
        }
        
        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(400).json({ 
                error: 'Invalid class or user reference',
                message: 'The class or user no longer exists'
            });
        }

        if (error.code === 'ER_BAD_NULL_ERROR') {
            return res.status(400).json({ 
                error: 'Missing required information',
                message: 'Please ensure all required fields are provided'
            });
        }
        
        res.status(500).json({ 
            error: 'Server error joining class',
            message: 'An unexpected error occurred. Please try again.'
        });
    }
};

// Get user's enrolled classes
const getUserClasses = async (req, res) => {
    try {
        const userId = req.user.user_id;

        const [classes] = await pool.execute(`
            SELECT c.class_id, c.class_name, c.class_code, c.description, 
                   c.created_by, e.role, e.enrolled_at, u.name as created_by_name,
                   COUNT(DISTINCT a.activity_id) as total_activities,
                   COUNT(DISTINCT e2.user_id) as total_members
            FROM Classes c
            JOIN Enrollments e ON c.class_id = e.class_id
            JOIN Users u ON c.created_by = u.user_id
            LEFT JOIN Activities a ON c.class_id = a.class_id
            LEFT JOIN Enrollments e2 ON c.class_id = e2.class_id AND e2.status = 'Active'
            WHERE e.user_id = ? AND e.status = 'Active' 
            AND c.status = 'Active' 
            AND e.is_archived = FALSE
            GROUP BY c.class_id, c.class_name, c.class_code, c.description, 
                     c.created_by, e.role, e.enrolled_at, u.name
            ORDER BY e.enrolled_at DESC
        `, [userId]);

        res.json({ classes });

    } catch (error) {
        console.error('Get classes error:', error);
        res.status(500).json({ error: 'Server error fetching classes' });
    }
};

// Get class details with members
const getClassDetails = async (req, res) => {
    try {
        const { classId } = req.params;
        const userId = req.user.user_id;

        // Verify user has access to this class (active enrollment only)
        const [enrollment] = await pool.execute(
            'SELECT role FROM Enrollments WHERE user_id = ? AND class_id = ? AND status = "Active"',
            [userId, classId]
        );

        if (enrollment.length === 0) {
            return res.status(403).json({ error: 'Access denied to this class or access has been revoked' });
        }

        // Get class information
        const [classInfo] = await pool.execute(`
            SELECT c.class_id, c.class_name, c.class_code, c.description, 
                   c.created_at, u.name as created_by_name
            FROM Classes c
            JOIN Users u ON c.created_by = u.user_id
            WHERE c.class_id = ?
        `, [classId]);

        // Get class members (only active members)
        const [members] = await pool.execute(`
            SELECT u.user_id, u.name, u.email, e.role, e.enrolled_at
            FROM Users u
            JOIN Enrollments e ON u.user_id = e.user_id
            WHERE e.class_id = ? AND e.status = 'Active'
            ORDER BY e.role DESC, u.name ASC
        `, [classId]);

        // Get recent activities
        const [activities] = await pool.execute(`
            SELECT a.activity_id, a.title, a.deadline, a.created_at,
                   COUNT(s.submission_id) as submission_count
            FROM Activities a
            LEFT JOIN Submissions s ON a.activity_id = s.activity_id
            WHERE a.class_id = ?
            GROUP BY a.activity_id, a.title, a.deadline, a.created_at
            ORDER BY a.created_at DESC
            LIMIT 5
        `, [classId]);

        res.json({
            class: classInfo[0],
            members,
            recent_activities: activities,
            user_role: enrollment[0].role
        });

    } catch (error) {
        console.error('Get class details error:', error);
        res.status(500).json({ error: 'Server error fetching class details' });
    }
};

// Update member role (Teacher only)
const updateMemberRole = async (req, res) => {
    try {
        const { classId } = req.params;
        const { userId: targetUserId, role } = req.body;
        const currentUserId = req.user.user_id;

        // Validate role
        if (!['Teacher', 'Student'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role. Must be Teacher or Student' });
        }

        // Check if target user is enrolled in class
        const [targetEnrollment] = await pool.execute(
            'SELECT enrollment_id FROM Enrollments WHERE user_id = ? AND class_id = ?',
            [targetUserId, classId]
        );

        if (targetEnrollment.length === 0) {
            return res.status(404).json({ error: 'User not found in this class' });
        }

        // Check if trying to modify class creator (optional restriction)
        const [classInfo] = await pool.execute(
            'SELECT created_by FROM Classes WHERE class_id = ?',
            [classId]
        );

        if (classInfo[0].created_by === targetUserId && role === 'Student') {
            return res.status(403).json({ error: 'Cannot demote class creator' });
        }

        // Update role
        await pool.execute(
            'UPDATE Enrollments SET role = ? WHERE user_id = ? AND class_id = ?',
            [role, targetUserId, classId]
        );

        res.json({ message: 'Member role updated successfully' });

    } catch (error) {
        console.error('Update member role error:', error);
        res.status(500).json({ error: 'Server error updating member role' });
    }
};

// Archive class (Teacher only)
const archiveClass = async (req, res) => {
    try {
        const { classId } = req.params;
        const userId = req.user.user_id;

        // Verify user is a teacher in this class
        const [enrollment] = await pool.execute(
            'SELECT role FROM Enrollments WHERE user_id = ? AND class_id = ? AND status = "Active"',
            [userId, classId]
        );

        if (enrollment.length === 0 || enrollment[0].role !== 'Teacher') {
            return res.status(403).json({ error: 'Only teachers can archive classes' });
        }

        // Get class info and all enrolled students
        const [classInfo] = await pool.execute(
            'SELECT class_name FROM Classes WHERE class_id = ?',
            [classId]
        );

        const [students] = await pool.execute(`
            SELECT u.user_id, u.name, u.email
            FROM Enrollments e
            JOIN Users u ON e.user_id = u.user_id
            WHERE e.class_id = ? AND e.role = 'Student' AND e.status = 'Active'
        `, [classId]);

        const [teacherInfo] = await pool.execute(
            'SELECT name FROM Users WHERE user_id = ?',
            [userId]
        );

        // Update class status to archived
        await pool.execute(
            'UPDATE Classes SET status = "Archived", archived_at = NOW() WHERE class_id = ?',
            [classId]
        );

        // Send dual notifications to all students
        const { sendDualNotification } = require('../services/emailService');
        
        for (const student of students) {
            await sendDualNotification(
                {
                    userId: student.user_id,
                    type: 'system',
                    title: 'Class Archived',
                    message: `${classInfo[0].class_name} has been archived by the teacher. You can still view it in Archived Rooms.`,
                    relatedId: classId
                },
                {
                    to: student.email,
                    template: 'classArchived',
                    data: {
                        studentName: student.name,
                        className: classInfo[0].class_name,
                        teacherName: teacherInfo[0].name,
                        siteUrl: process.env.SITE_URL || 'http://localhost:3000'
                    }
                }
            );
        }

        res.json({ message: 'Class archived successfully', notified_students: students.length });

    } catch (error) {
        console.error('Archive class error:', error);
        res.status(500).json({ error: 'Server error archiving class' });
    }
};

// Unarchive class (Room Owner only)
const unarchiveClass = async (req, res) => {
    try {
        const { classId } = req.params;
        const userId = req.user.user_id;

        // Verify user is the room owner (creator)
        const [classInfo] = await pool.execute(
            'SELECT created_by, class_name FROM Classes WHERE class_id = ?',
            [classId]
        );

        if (classInfo.length === 0) {
            return res.status(404).json({ error: 'Class not found' });
        }

        if (classInfo[0].created_by !== userId) {
            return res.status(403).json({ 
                error: 'Only the room owner can restore this class',
                message: 'You must be the creator of this room to restore it'
            });
        }

        // Update class status to active
        await pool.execute(
            'UPDATE Classes SET status = "Active", archived_at = NULL WHERE class_id = ?',
            [classId]
        );

        res.json({ message: 'Class restored successfully' });

    } catch (error) {
        console.error('Unarchive class error:', error);
        res.status(500).json({ error: 'Server error restoring class' });
    }
};

// Delete class permanently (Teacher only)
const deleteClass = async (req, res) => {
    try {
        const { classId } = req.params;
        const userId = req.user.user_id;

        // Verify user is a teacher in this class
        const [enrollment] = await pool.execute(
            'SELECT role FROM Enrollments WHERE user_id = ? AND class_id = ? AND status = "Active"',
            [userId, classId]
        );

        if (enrollment.length === 0 || enrollment[0].role !== 'Teacher') {
            return res.status(403).json({ error: 'Only teachers can delete classes' });
        }

        // Start transaction for cascading delete
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // Delete submissions for all activities in this class
            await connection.execute(`
                DELETE s FROM Submissions s
                INNER JOIN Activities a ON s.activity_id = a.activity_id
                WHERE a.class_id = ?
            `, [classId]);

            // Delete activities
            await connection.execute(
                'DELETE FROM Activities WHERE class_id = ?',
                [classId]
            );

            // Delete enrollments
            await connection.execute(
                'DELETE FROM Enrollments WHERE class_id = ?',
                [classId]
            );

            // Delete the class
            await connection.execute(
                'DELETE FROM Classes WHERE class_id = ?',
                [classId]
            );

            await connection.commit();
            connection.release();

            res.json({ message: 'Class deleted successfully' });

        } catch (error) {
            await connection.rollback();
            connection.release();
            throw error;
        }

    } catch (error) {
        console.error('Delete class error:', error);
        res.status(500).json({ error: 'Server error deleting class' });
    }
};

// Get archived classes (Both teachers and students can see)
const getArchivedClasses = async (req, res) => {
    try {
        const userId = req.user.user_id;

        const [classes] = await pool.execute(`
            SELECT c.class_id, c.class_name, c.class_code, c.description, 
                   c.created_by, e.role, e.enrolled_at, u.name as created_by_name,
                   c.status as class_status, e.is_archived as personal_archive,
                   COUNT(DISTINCT a.activity_id) as total_activities,
                   COUNT(DISTINCT e2.user_id) as total_members
            FROM Classes c
            JOIN Enrollments e ON c.class_id = e.class_id
            JOIN Users u ON c.created_by = u.user_id
            LEFT JOIN Activities a ON c.class_id = a.class_id
            LEFT JOIN Enrollments e2 ON c.class_id = e2.class_id AND e2.status = 'Active'
            WHERE e.user_id = ? AND e.status = 'Active' 
            AND (
                (e.role = 'Teacher' AND c.status = 'Archived') OR
                (e.role = 'Student' AND (c.status = 'Archived' OR e.is_archived = TRUE))
            )
            GROUP BY c.class_id, c.class_name, c.class_code, c.description, 
                     c.created_by, e.role, e.enrolled_at, u.name, c.status, e.is_archived
            ORDER BY e.enrolled_at DESC
        `, [userId]);

        res.json({ classes });

    } catch (error) {
        console.error('Get archived classes error:', error);
        res.status(500).json({ error: 'Server error fetching archived classes' });
    }
};

// Archive class personally (Student only)
const archivePersonal = async (req, res) => {
    try {
        const { classId } = req.params;
        const userId = req.user.user_id;

        // Verify user is enrolled in this class
        const [enrollment] = await pool.execute(
            'SELECT role FROM Enrollments WHERE user_id = ? AND class_id = ? AND status = "Active"',
            [userId, classId]
        );

        if (enrollment.length === 0) {
            return res.status(403).json({ error: 'Not enrolled in this class' });
        }

        // Update personal archive status
        await pool.execute(
            'UPDATE Enrollments SET is_archived = TRUE WHERE user_id = ? AND class_id = ?',
            [userId, classId]
        );

        res.json({ message: 'Class archived personally' });

    } catch (error) {
        console.error('Personal archive error:', error);
        res.status(500).json({ error: 'Server error archiving class' });
    }
};

// Unarchive class personally (Student only)
const unarchivePersonal = async (req, res) => {
    try {
        const { classId } = req.params;
        const userId = req.user.user_id;

        // Verify user is enrolled in this class
        const [enrollment] = await pool.execute(
            'SELECT role FROM Enrollments WHERE user_id = ? AND class_id = ?',
            [userId, classId]
        );

        if (enrollment.length === 0) {
            return res.status(403).json({ error: 'Not enrolled in this class' });
        }

        // Update personal archive status
        await pool.execute(
            'UPDATE Enrollments SET is_archived = FALSE WHERE user_id = ? AND class_id = ?',
            [userId, classId]
        );

        res.json({ message: 'Class unarchived personally' });

    } catch (error) {
        console.error('Personal unarchive error:', error);
        res.status(500).json({ error: 'Server error unarchiving class' });
    }
};

// Leave class (Student only)
const leaveClass = async (req, res) => {
    try {
        const { classId } = req.params;
        const userId = req.user.user_id;

        // Verify user is a student in this class and get details
        const [enrollment] = await pool.execute(`
            SELECT e.role, u.name as student_name, u.email as student_email,
                   c.class_name, c.created_by
            FROM Enrollments e
            JOIN Users u ON e.user_id = u.user_id
            JOIN Classes c ON e.class_id = c.class_id
            WHERE e.user_id = ? AND e.class_id = ? AND e.status = 'Active'
        `, [userId, classId]);

        if (enrollment.length === 0) {
            return res.status(403).json({ error: 'Not enrolled in this class' });
        }

        if (enrollment[0].role === 'Teacher') {
            return res.status(403).json({ error: 'Teachers cannot leave their own classes. Use delete instead.' });
        }

        const studentInfo = enrollment[0];

        // Start transaction
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // Delete the enrollment
            await connection.execute(
                'DELETE FROM Enrollments WHERE user_id = ? AND class_id = ?',
                [userId, classId]
            );

            // Delete any pending join requests for this user and class
            await connection.execute(
                'DELETE FROM JoinRequests WHERE user_id = ? AND class_id = ?',
                [userId, classId]
            );

            await connection.commit();
            connection.release();

            // Notify all teachers in the class with dual notification
            const [teachers] = await pool.execute(`
                SELECT e.user_id, u.name as teacher_name, u.email as teacher_email
                FROM Enrollments e
                JOIN Users u ON e.user_id = u.user_id
                WHERE e.class_id = ? AND e.role = 'Teacher' AND e.status = 'Active'
            `, [classId]);

            const { sendDualNotification } = require('../services/emailService');

            for (const teacher of teachers) {
                await sendDualNotification(
                    {
                        userId: teacher.user_id,
                        type: 'system',
                        title: 'Student Left Class',
                        message: `${studentInfo.student_name} has left ${studentInfo.class_name}`,
                        relatedId: classId
                    },
                    {
                        to: teacher.teacher_email,
                        template: 'studentLeft',
                        data: {
                            teacherName: teacher.teacher_name,
                            studentName: studentInfo.student_name,
                            className: studentInfo.class_name,
                            siteUrl: process.env.SITE_URL || 'http://localhost:3000'
                        }
                    }
                );
            }

            res.json({ message: 'Successfully left the class' });

        } catch (error) {
            await connection.rollback();
            connection.release();
            throw error;
        }

    } catch (error) {
        console.error('Leave class error:', error);
        res.status(500).json({ error: 'Server error leaving class' });
    }
};

module.exports = {
    createClass,
    joinClass,
    getUserClasses,
    getClassDetails,
    updateMemberRole,
    archiveClass,
    unarchiveClass,
    deleteClass,
    getArchivedClasses,
    archivePersonal,
    unarchivePersonal,
    leaveClass
};