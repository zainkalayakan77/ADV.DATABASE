// Member Management Controller - Handles kick/block functionality and join requests
const { pool } = require('../config/database');
const { sendDualNotification } = require('../services/emailService');

// Kick member from class (Teacher only) with dual notification
const kickMember = async (req, res) => {
    try {
        const { classId } = req.params;
        const { userId: targetUserId, reason } = req.body;
        const teacherId = req.user.user_id;

        // Verify teacher has permission and target user exists in class
        const [enrollment] = await pool.execute(`
            SELECT e1.role as teacher_role, e2.user_id as target_user, e2.role as target_role,
                   c.created_by, u.name as target_name, u.email as target_email, 
                   c.class_name, tu.name as teacher_name
            FROM Enrollments e1
            JOIN Classes c ON e1.class_id = c.class_id
            JOIN Users tu ON e1.user_id = tu.user_id
            LEFT JOIN Enrollments e2 ON e2.class_id = c.class_id AND e2.user_id = ?
            LEFT JOIN Users u ON e2.user_id = u.user_id
            WHERE e1.user_id = ? AND e1.class_id = ? AND e1.role = 'Teacher' AND e1.status = 'Active'
        `, [targetUserId, teacherId, classId]);

        if (enrollment.length === 0 || !enrollment[0].target_user) {
            return res.status(404).json({ error: 'User not found in class or insufficient permissions' });
        }

        // Prevent kicking the class creator
        if (enrollment[0].created_by === targetUserId) {
            return res.status(403).json({ error: 'Cannot kick the class creator' });
        }

        // Prevent kicking other teachers (optional business rule)
        if (enrollment[0].target_role === 'Teacher') {
            return res.status(403).json({ error: 'Cannot kick other teachers' });
        }

        // Update enrollment status to 'Kicked'
        await pool.execute(
            'UPDATE Enrollments SET status = "Kicked", kicked_at = NOW(), kicked_by = ? WHERE user_id = ? AND class_id = ?',
            [teacherId, targetUserId, classId]
        );

        // Send dual notification (in-app + email) to kicked student
        const kickReason = reason || 'No reason provided';
        const [classInfo] = await pool.execute(
            'SELECT class_code FROM Classes WHERE class_id = ?',
            [classId]
        );
        
        await sendDualNotification(
            {
                userId: targetUserId,
                type: 'system',
                title: 'You have been removed from a class',
                message: `You have been removed from "${enrollment[0].class_name}". Reason: ${kickReason}`,
                relatedId: classId
            },
            {
                to: enrollment[0].target_email,
                template: 'studentKicked',
                data: {
                    studentName: enrollment[0].target_name,
                    className: enrollment[0].class_name,
                    teacherName: enrollment[0].teacher_name,
                    reason: kickReason,
                    classCode: classInfo[0].class_code,
                    siteUrl: process.env.SITE_URL || 'http://localhost:3000'
                }
            }
        );

        // Create notification for the teacher (confirmation)
        await pool.execute(`
            INSERT INTO Notifications (user_id, type, title, message, related_id)
            VALUES (?, 'system', ?, ?, ?)
        `, [
            teacherId,
            'Member Kicked',
            `You have kicked ${enrollment[0].target_name} from "${enrollment[0].class_name}".`,
            targetUserId
        ]);

        res.json({ 
            message: 'Member kicked successfully',
            kicked_user: enrollment[0].target_name,
            reason: kickReason
        });

    } catch (error) {
        console.error('Kick member error:', error);
        res.status(500).json({ error: 'Server error kicking member' });
    }
};

// Submit join request (for kicked members) with cooldown check and dual notification
const submitJoinRequest = async (req, res) => {
    try {
        const { classId } = req.params;
        const { message } = req.body;
        const userId = req.user.user_id;

        // Check if user was kicked from this class
        const [kickedStatus] = await pool.execute(
            'SELECT status FROM Enrollments WHERE user_id = ? AND class_id = ? AND status = "Kicked"',
            [userId, classId]
        );

        if (kickedStatus.length === 0) {
            return res.status(400).json({ error: 'You are not kicked from this class or already have access' });
        }

        // Check if there's already a pending request
        const [existingRequest] = await pool.execute(
            'SELECT request_id, status, reviewed_at FROM JoinRequests WHERE user_id = ? AND class_id = ? AND status IN ("Pending", "Rejected")',
            [userId, classId]
        );

        if (existingRequest.length > 0) {
            const request = existingRequest[0];
            
            if (request.status === 'Pending') {
                return res.status(409).json({ error: 'You already have a pending join request for this class' });
            }
            
            // Check 24-hour cooldown for rejected requests
            if (request.status === 'Rejected' && request.reviewed_at) {
                const cooldownEnd = new Date(request.reviewed_at);
                cooldownEnd.setHours(cooldownEnd.getHours() + 24);
                
                if (new Date() < cooldownEnd) {
                    const hoursLeft = Math.ceil((cooldownEnd - new Date()) / (1000 * 60 * 60));
                    return res.status(429).json({ 
                        error: `You must wait ${hoursLeft} more hours before submitting another request` 
                    });
                }
            }
        }

        // Create or update join request
        const [result] = await pool.execute(`
            INSERT INTO JoinRequests (user_id, class_id, message, status, requested_at)
            VALUES (?, ?, ?, 'Pending', NOW())
            ON DUPLICATE KEY UPDATE 
            message = VALUES(message), 
            status = 'Pending', 
            requested_at = NOW(),
            reviewed_at = NULL,
            reviewed_by = NULL
        `, [userId, classId, message || 'Requesting to rejoin the class']);

        // Notify all teachers in the class with dual notification
        const [teachers] = await pool.execute(`
            SELECT e.user_id, u.name as requester_name, u.email as requester_email,
                   c.class_name, tu.name as teacher_name, tu.email as teacher_email
            FROM Enrollments e
            JOIN Users u ON u.user_id = ?
            JOIN Classes c ON c.class_id = ?
            JOIN Users tu ON e.user_id = tu.user_id
            WHERE e.class_id = ? AND e.role = 'Teacher' AND e.status = 'Active'
        `, [userId, classId, classId]);

        const requestId = result.insertId || existingRequest[0].request_id;

        for (const teacher of teachers) {
            // Send dual notification to each teacher
            await sendDualNotification(
                {
                    userId: teacher.user_id,
                    type: 'join_request',
                    title: 'Join Request',
                    message: `${teacher.requester_name} is requesting to rejoin ${teacher.class_name}`,
                    relatedId: requestId
                },
                {
                    to: teacher.teacher_email,
                    template: 'rejoinRequest',
                    data: {
                        teacherName: teacher.teacher_name,
                        studentName: teacher.requester_name,
                        className: teacher.class_name,
                        message: message || 'Requesting to rejoin the class',
                        siteUrl: process.env.SITE_URL || 'http://localhost:3000'
                    }
                }
            );
        }

        res.json({ message: 'Join request submitted successfully' });

    } catch (error) {
        console.error('Submit join request error:', error);
        res.status(500).json({ error: 'Server error submitting join request' });
    }
};

// Handle join request (approve/reject) with dual notification
const handleJoinRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const { action } = req.body; // 'approve' or 'reject'
        const teacherId = req.user.user_id;

        if (!['approve', 'reject'].includes(action)) {
            return res.status(400).json({ error: 'Invalid action. Must be "approve" or "reject"' });
        }

        // Get request details and verify teacher has permission
        const [requestDetails] = await pool.execute(`
            SELECT jr.user_id, jr.class_id, jr.status, u.name as requester_name, u.email as requester_email,
                   c.class_name, jr.message, jr.requested_at
            FROM JoinRequests jr
            JOIN Users u ON jr.user_id = u.user_id
            JOIN Classes c ON jr.class_id = c.class_id
            JOIN Enrollments e ON c.class_id = e.class_id
            WHERE jr.request_id = ? AND e.user_id = ? AND e.role = 'Teacher' AND e.status = 'Active'
        `, [requestId, teacherId]);

        if (requestDetails.length === 0) {
            return res.status(404).json({ error: 'Join request not found or insufficient permissions' });
        }

        const request = requestDetails[0];

        if (request.status !== 'Pending') {
            return res.status(400).json({ error: 'This request has already been processed' });
        }

        const newStatus = action === 'approve' ? 'Approved' : 'Rejected';

        // Start transaction
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // Update request status
            await connection.execute(
                'UPDATE JoinRequests SET status = ?, reviewed_at = NOW(), reviewed_by = ? WHERE request_id = ?',
                [newStatus, teacherId, requestId]
            );

            if (action === 'approve') {
                // Restore user's enrollment status to Active
                await connection.execute(
                    'UPDATE Enrollments SET status = "Active", kicked_at = NULL, kicked_by = NULL WHERE user_id = ? AND class_id = ?',
                    [request.user_id, request.class_id]
                );

                // Get teacher name
                const [teacherInfo] = await connection.execute(
                    'SELECT name FROM Users WHERE user_id = ?',
                    [teacherId]
                );

                // Send dual notification for approval
                await sendDualNotification(
                    {
                        userId: request.user_id,
                        type: 'system',
                        title: 'Request Approved',
                        message: `Your request to rejoin "${request.class_name}" has been approved. You now have access to the class.`,
                        relatedId: requestId
                    },
                    {
                        to: request.requester_email,
                        template: 'requestApproved',
                        data: {
                            studentName: request.requester_name,
                            className: request.class_name,
                            teacherName: teacherInfo[0].name,
                            siteUrl: process.env.SITE_URL || 'http://localhost:3000'
                        }
                    }
                );
            } else {
                // For rejection, add a cooldown period by updating the request timestamp
                await connection.execute(
                    'UPDATE JoinRequests SET reviewed_at = NOW() WHERE request_id = ?',
                    [requestId]
                );

                // Get teacher name
                const [teacherInfo] = await connection.execute(
                    'SELECT name FROM Users WHERE user_id = ?',
                    [teacherId]
                );

                // Send dual notification for rejection
                await sendDualNotification(
                    {
                        userId: request.user_id,
                        type: 'system',
                        title: 'Request Rejected',
                        message: `Your request to rejoin "${request.class_name}" has been rejected. You can try again after 24 hours.`,
                        relatedId: requestId
                    },
                    {
                        to: request.requester_email,
                        template: 'requestRejected',
                        data: {
                            studentName: request.requester_name,
                            className: request.class_name,
                            teacherName: teacherInfo[0].name,
                            siteUrl: process.env.SITE_URL || 'http://localhost:3000'
                        }
                    }
                );
            }

            await connection.commit();
            connection.release();

            res.json({ 
                message: `Join request ${action}d successfully`,
                requester: request.requester_name,
                action: newStatus,
                class_name: request.class_name
            });

        } catch (error) {
            await connection.rollback();
            connection.release();
            throw error;
        }

    } catch (error) {
        console.error('Handle join request error:', error);
        res.status(500).json({ error: 'Server error handling join request' });
    }
};

// Get pending join requests for teacher
const getPendingJoinRequests = async (req, res) => {
    try {
        const teacherId = req.user.user_id;

        const [requests] = await pool.execute(`
            SELECT jr.request_id, jr.message, jr.requested_at, 
                   u.name as requester_name, u.email as requester_email,
                   c.class_name, c.class_id
            FROM JoinRequests jr
            JOIN Users u ON jr.user_id = u.user_id
            JOIN Classes c ON jr.class_id = c.class_id
            JOIN Enrollments e ON c.class_id = e.class_id
            WHERE jr.status = 'Pending' 
            AND e.user_id = ? AND e.role = 'Teacher' AND e.status = 'Active'
            ORDER BY jr.requested_at DESC
        `, [teacherId]);

        res.json({ requests });

    } catch (error) {
        console.error('Get pending join requests error:', error);
        res.status(500).json({ error: 'Server error fetching join requests' });
    }
};

module.exports = {
    kickMember,
    submitJoinRequest,
    handleJoinRequest,
    getPendingJoinRequests
};