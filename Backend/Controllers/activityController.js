// Activity Management Controller - Handles CRUD operations for activities with file uploads
const { pool } = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../uploads/activities');
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // Sanitize filename to prevent security issues
        const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + '-' + sanitizedName);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 20 * 1024 * 1024, // 20MB limit
        files: 10 // Maximum 10 files
    },
    fileFilter: (req, file, cb) => {
        // Accept common academic file types
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/gif',
            'text/plain'
        ];
        
        const allowedExtensions = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.jpg', '.jpeg', '.png', '.gif', '.txt'];
        const ext = path.extname(file.originalname).toLowerCase();
        
        if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Allowed: PDF, Word, PowerPoint, Images, Text'));
        }
    }
});

// Middleware for handling multiple file uploads
const uploadFiles = upload.array('files', 10);

// Middleware for handling single submission file
const uploadSubmissionFile = upload.single('file');

// Create new activity (Teacher only) with file upload support
const createActivity = async (req, res) => {
    try {
        const { classId } = req.params;
        const { title, description, deadline, teacher_notes, is_accepting_submissions, max_score } = req.body;
        const userId = req.user.user_id;

        // Input validation
        if (!title) {
            return res.status(400).json({ error: 'Activity title is required' });
        }

        // Parse and validate max_score
        const activityMaxScore = max_score ? parseFloat(max_score) : 100;
        if (activityMaxScore <= 0) {
            return res.status(400).json({ error: 'Max score must be greater than 0' });
        }

        // Validate deadline format if provided
        let deadlineDate = null;
        if (deadline) {
            deadlineDate = new Date(deadline);
            if (isNaN(deadlineDate.getTime())) {
                return res.status(400).json({ error: 'Invalid deadline format' });
            }
        }

        // Handle file paths if files were uploaded
        let attachmentPaths = null;
        if (req.files && req.files.length > 0) {
            attachmentPaths = req.files.map(file => file.filename).join(',');
        }

        // Parse submission toggle (default to true if not provided)
        const acceptingSubmissions = is_accepting_submissions === 'false' ? false : true;

        // Insert activity with teacher notes, submission toggle, and max_score
        const [result] = await pool.execute(
            'INSERT INTO Activities (class_id, title, description, deadline, is_accepting_submissions, max_score, attachment_path, teacher_notes, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [classId, title, description || null, deadlineDate, acceptingSubmissions, activityMaxScore, attachmentPaths, teacher_notes || null, userId]
        );

        const activityId = result.insertId;

        // Send dual notifications to all students in the class
        try {
            const [students] = await pool.execute(`
                SELECT u.user_id, u.name, u.email
                FROM Enrollments e
                JOIN Users u ON e.user_id = u.user_id
                WHERE e.class_id = ? AND e.role = 'Student' AND e.status = 'Active'
            `, [classId]);

            // Get teacher info
            const [teacherInfo] = await pool.execute(
                'SELECT name FROM Users WHERE user_id = ?',
                [userId]
            );

            // Get class info
            const [classInfo] = await pool.execute(
                'SELECT class_name FROM Classes WHERE class_id = ?',
                [classId]
            );

            const { sendDualNotification } = require('../services/emailService');

            for (const student of students) {
                await sendDualNotification(
                    {
                        userId: student.user_id,
                        type: 'system',
                        title: 'New Activity Posted',
                        message: `Your teacher has posted a new activity: "${title}"${deadlineDate ? ` (Due: ${deadlineDate.toLocaleDateString()})` : ''}`,
                        relatedId: activityId
                    },
                    {
                        to: student.email,
                        template: 'activityCreated',
                        data: {
                            studentName: student.name,
                            activityTitle: title,
                            activityDescription: description || 'No description provided',
                            deadline: deadlineDate ? deadlineDate.toLocaleString() : 'No deadline',
                            teacherName: teacherInfo[0].name,
                            className: classInfo[0].class_name,
                            siteUrl: process.env.SITE_URL || 'http://localhost:3000'
                        }
                    }
                );
            }
        } catch (notifError) {
            // Log notification error but don't fail the activity creation
            console.error('Failed to send activity creation notifications:', notifError);
        }

        res.status(201).json({
            message: 'Activity created successfully',
            activity: {
                id: activityId,
                title,
                description,
                deadline: deadlineDate,
                is_accepting_submissions: acceptingSubmissions,
                max_score: activityMaxScore,
                class_id: classId,
                files_uploaded: req.files ? req.files.length : 0
            },
            notifications_sent: true
        });

    } catch (error) {
        console.error('Create activity error:', error);
        res.status(500).json({ error: 'Server error creating activity' });
    }
};

// Get activities for a class with proper access control
const getClassActivities = async (req, res) => {
    try {
        const { classId } = req.params;
        const userId = req.user.user_id;

        // Verify user has active access to this class
        const [userAccess] = await pool.execute(
            'SELECT role FROM Enrollments WHERE user_id = ? AND class_id = ? AND status = "Active"',
            [userId, classId]
        );

        if (userAccess.length === 0) {
            return res.status(403).json({ error: 'Access denied to this class' });
        }

        const userRole = userAccess[0].role;

        // Get activities with submission status for current user
        // Students see all activities, Teachers see all activities with full details
        const [activities] = await pool.execute(`
            SELECT a.activity_id, a.title, a.description, a.deadline, a.created_at,
                   u.name as created_by_name,
                   ${userRole === 'Teacher' ? 'a.teacher_notes,' : ''}
                   s.submission_id, s.score, s.feedback, s.submission_date,
                   COUNT(DISTINCT s_all.submission_id) as total_submissions
            FROM Activities a
            JOIN Users u ON a.created_by = u.user_id
            LEFT JOIN Submissions s ON a.activity_id = s.activity_id AND s.user_id = ?
            LEFT JOIN Submissions s_all ON a.activity_id = s_all.activity_id
            WHERE a.class_id = ?
            GROUP BY a.activity_id, a.title, a.description, a.deadline, a.created_at,
                     u.name, s.submission_id, s.score, s.feedback, s.submission_date
            ORDER BY a.deadline ASC, a.created_at DESC
        `, [userId, classId]);

        res.json({ 
            activities,
            user_role: userRole
        });

    } catch (error) {
        console.error('Get activities error:', error);
        res.status(500).json({ error: 'Server error fetching activities' });
    }
};

// Get single activity details with privacy controls and archive status
const getActivityDetails = async (req, res) => {
    try {
        const { activityId } = req.params;
        const userId = req.user.user_id;

        // Get activity details with class archive status
        const [activities] = await pool.execute(`
            SELECT a.activity_id, a.class_id, a.title, a.description, a.deadline, 
                   a.is_accepting_submissions, a.attachment_path, a.created_at, a.created_by,
                   u.name as created_by_name,
                   c.class_name, c.status as class_status,
                   e.role as user_role, e.is_archived as personal_archive
            FROM Activities a
            JOIN Users u ON a.created_by = u.user_id
            JOIN Classes c ON a.class_id = c.class_id
            JOIN Enrollments e ON c.class_id = e.class_id AND e.user_id = ?
            WHERE a.activity_id = ? AND e.status = 'Active'
        `, [userId, activityId]);

        if (activities.length === 0) {
            return res.status(404).json({ error: 'Activity not found or access denied' });
        }

        const activity = activities[0];
        const userRole = activity.user_role;
        const isArchived = activity.class_status === 'Archived' || activity.personal_archive === 1;

        // Add teacher notes only for teachers
        if (userRole === 'Teacher') {
            const [teacherData] = await pool.execute(
                'SELECT teacher_notes FROM Activities WHERE activity_id = ?',
                [activityId]
            );
            activity.teacher_notes = teacherData[0]?.teacher_notes || null;
        }

        // Parse attachment files if they exist
        let attachments = [];
        if (activity.attachment_path) {
            attachments = activity.attachment_path.split(',').map(filename => ({
                filename: filename,
                original_name: filename.split('-').slice(2).join('-'), // Remove timestamp prefix
                url: `/uploads/activities/${filename}`,
                download_url: `/api/activities/${activityId}/download/${filename}`
            }));
        }
        activity.attachments = attachments;
        delete activity.attachment_path; // Remove raw path from response

        // Get user's own submission if exists
        const [submissions] = await pool.execute(
            'SELECT submission_id, content, file_path, score, feedback, submission_date FROM Submissions WHERE activity_id = ? AND user_id = ?',
            [activityId, userId]
        );

        // Parse submission file if exists
        if (submissions.length > 0 && submissions[0].file_path) {
            const filename = submissions[0].file_path;
            submissions[0].file = {
                filename: filename,
                original_name: filename.split('-').slice(2).join('-'),
                download_url: `/api/activities/submissions/${submissions[0].submission_id}/download`
            };
        }

        // If user is teacher, get all submissions with student info
        let allSubmissions = [];
        if (userRole === 'Teacher') {
            const [teacherSubmissions] = await pool.execute(`
                SELECT 
                    e.user_id as student_id,
                    u.name as student_name, 
                    u.email as student_email,
                    s.submission_id,
                    s.content, 
                    s.file_path, 
                    s.score, 
                    s.feedback, 
                    s.submission_date
                FROM Enrollments e
                JOIN Users u ON e.user_id = u.user_id
                LEFT JOIN Submissions s ON s.activity_id = ? AND s.user_id = e.user_id
                WHERE e.class_id = ? AND e.role = 'Student' AND e.status = 'Active'
                ORDER BY s.submission_date DESC, u.name ASC
            `, [activityId, activity.class_id]);
            
            // Parse file info for each submission
            allSubmissions = teacherSubmissions.map(sub => {
                if (sub.file_path) {
                    sub.file = {
                        filename: sub.file_path,
                        original_name: sub.file_path.split('-').slice(2).join('-'),
                        download_url: `/api/activities/submissions/${sub.submission_id}/download`
                    };
                }
                return sub;
            });
        }

        res.json({
            activity,
            user_submission: submissions[0] || null,
            all_submissions: allSubmissions,
            user_role: userRole,
            is_archived: isArchived,
            can_submit: userRole === 'Student' && !isArchived && activity.is_accepting_submissions
        });

    } catch (error) {
        console.error('Get activity details error:', error);
        res.status(500).json({ error: 'Server error fetching activity details' });
    }
};

// Update activity (Teacher only) with notification and file management
const updateActivity = async (req, res) => {
    try {
        const { activityId } = req.params;
        const { title, description, deadline, teacher_notes, is_accepting_submissions, removed_files, max_score } = req.body;
        const userId = req.user.user_id;

        // Input validation
        if (!title) {
            return res.status(400).json({ error: 'Activity title is required' });
        }

        // Get current activity data to check for changes and verify ownership
        const [currentActivity] = await pool.execute(
            'SELECT title, description, deadline, is_accepting_submissions, max_score, class_id, created_by, attachment_path FROM Activities WHERE activity_id = ?',
            [activityId]
        );

        if (currentActivity.length === 0) {
            return res.status(404).json({ error: 'Activity not found' });
        }

        const oldActivity = currentActivity[0];
        const classId = oldActivity.class_id;

        // Verify user is a teacher in this class
        const [teacherCheck] = await pool.execute(
            'SELECT role FROM Enrollments WHERE user_id = ? AND class_id = ? AND role = "Teacher" AND status = "Active"',
            [userId, classId]
        );

        if (teacherCheck.length === 0) {
            return res.status(403).json({ error: 'Only teachers can edit activities' });
        }

        // Validate deadline format if provided
        let deadlineDate = null;
        let deadlineChanged = false;
        if (deadline) {
            deadlineDate = new Date(deadline);
            if (isNaN(deadlineDate.getTime())) {
                return res.status(400).json({ error: 'Invalid deadline format' });
            }
            // Check if deadline changed
            const oldDeadline = oldActivity.deadline ? new Date(oldActivity.deadline).getTime() : null;
            const newDeadline = deadlineDate.getTime();
            deadlineChanged = oldDeadline !== newDeadline;
        }

        // Parse and validate max_score
        const activityMaxScore = max_score ? parseFloat(max_score) : (oldActivity.max_score || 100);
        if (activityMaxScore <= 0) {
            return res.status(400).json({ error: 'Max score must be greater than 0' });
        }

        // Handle file management (removal and addition)
        let attachmentPaths = oldActivity.attachment_path;
        let filesRemoved = 0;
        
        // Process file removals
        if (removed_files) {
            const removedFilesList = typeof removed_files === 'string' ? removed_files.split(',') : removed_files;
            if (attachmentPaths) {
                const currentFiles = attachmentPaths.split(',');
                const remainingFiles = currentFiles.filter(file => !removedFilesList.includes(file));
                attachmentPaths = remainingFiles.length > 0 ? remainingFiles.join(',') : null;
                filesRemoved = currentFiles.length - remainingFiles.length;
                
                // Delete physical files from server
                for (const removedFile of removedFilesList) {
                    if (currentFiles.includes(removedFile)) {
                        const filePath = path.join(__dirname, '../uploads/activities', removedFile);
                        if (fs.existsSync(filePath)) {
                            try {
                                fs.unlinkSync(filePath);
                            } catch (err) {
                                console.error('Error deleting file:', err);
                            }
                        }
                    }
                }
            }
        }
        
        // Add new file uploads
        if (req.files && req.files.length > 0) {
            const newFiles = req.files.map(file => file.filename).join(',');
            attachmentPaths = attachmentPaths ? `${attachmentPaths},${newFiles}` : newFiles;
        }

        // Parse submission toggle - handle both string and boolean values
        let acceptingSubmissions;
        if (is_accepting_submissions === 'false' || is_accepting_submissions === false) {
            acceptingSubmissions = false;
        } else if (is_accepting_submissions === 'true' || is_accepting_submissions === true) {
            acceptingSubmissions = true;
        } else {
            acceptingSubmissions = oldActivity.is_accepting_submissions;
        }
        
        const submissionToggleChanged = Boolean(oldActivity.is_accepting_submissions) !== Boolean(acceptingSubmissions);
        const maxScoreChanged = oldActivity.max_score != activityMaxScore;

        // Update activity
        const [result] = await pool.execute(
            'UPDATE Activities SET title = ?, description = ?, deadline = ?, is_accepting_submissions = ?, max_score = ?, attachment_path = ?, teacher_notes = ? WHERE activity_id = ?',
            [title, description || null, deadlineDate, acceptingSubmissions, activityMaxScore, attachmentPaths, teacher_notes || null, activityId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Activity not found' });
        }

        // Send notifications if major changes were made
        const titleChanged = oldActivity.title !== title;
        const descriptionChanged = oldActivity.description !== description;
        
        if (titleChanged || descriptionChanged || deadlineChanged || submissionToggleChanged) {
            // Get all enrolled students
            const [students] = await pool.execute(`
                SELECT u.user_id, u.name, u.email
                FROM Enrollments e
                JOIN Users u ON e.user_id = u.user_id
                WHERE e.class_id = ? AND e.role = 'Student' AND e.status = 'Active'
            `, [classId]);

            // Get teacher info
            const [teacherInfo] = await pool.execute(
                'SELECT name FROM Users WHERE user_id = ?',
                [userId]
            );

            // Send dual notifications to all students
            const { sendDualNotification } = require('../services/emailService');
            
            let changeDescription = '';
            if (submissionToggleChanged && acceptingSubmissions) {
                changeDescription = 'Submissions are now open';
            } else if (submissionToggleChanged && !acceptingSubmissions) {
                changeDescription = 'Submissions have been closed';
            } else if (deadlineChanged) {
                changeDescription = 'The deadline has been updated';
            } else if (titleChanged) {
                changeDescription = 'The title has been changed';
            } else if (descriptionChanged) {
                changeDescription = 'The instructions have been updated';
            }

            for (const student of students) {
                await sendDualNotification(
                    {
                        userId: student.user_id,
                        type: 'system',
                        title: submissionToggleChanged && acceptingSubmissions ? 'Submissions Now Open' : 'Activity Updated',
                        message: `Your teacher has edited "${title}". ${changeDescription}.`,
                        relatedId: activityId
                    },
                    {
                        to: student.email,
                        template: 'activityUpdated',
                        data: {
                            studentName: student.name,
                            activityTitle: title,
                            teacherName: teacherInfo[0].name,
                            changeDescription: changeDescription,
                            siteUrl: process.env.SITE_URL || 'http://localhost:3000'
                        }
                    }
                );
            }
        }

        res.json({ 
            message: 'Activity updated successfully',
            notifications_sent: titleChanged || descriptionChanged || deadlineChanged || submissionToggleChanged,
            files_added: req.files ? req.files.length : 0,
            files_removed: filesRemoved,
            is_accepting_submissions: acceptingSubmissions,
            max_score: activityMaxScore
        });

    } catch (error) {
        console.error('Update activity error:', error);
        res.status(500).json({ error: 'Server error updating activity' });
    }
};

// Delete activity (Teacher only)
const deleteActivity = async (req, res) => {
    try {
        const { activityId } = req.params;
        const userId = req.user.user_id;

        // Get activity details to verify ownership and get file paths
        const [activities] = await pool.execute(`
            SELECT a.activity_id, a.class_id, a.attachment_path, a.created_by,
                   c.created_by as room_creator
            FROM Activities a
            JOIN Classes c ON a.class_id = c.class_id
            WHERE a.activity_id = ?
        `, [activityId]);

        if (activities.length === 0) {
            return res.status(404).json({ error: 'Activity not found' });
        }

        const activity = activities[0];

        // Verify user is the room creator (only room creator can delete activities)
        if (activity.room_creator !== userId) {
            return res.status(403).json({ error: 'Only the room creator can delete activities' });
        }

        // Get all submission files for this activity
        const [submissions] = await pool.execute(
            'SELECT file_path FROM Submissions WHERE activity_id = ? AND file_path IS NOT NULL',
            [activityId]
        );

        // Delete activity attachment files
        if (activity.attachment_path) {
            const attachmentFiles = activity.attachment_path.split(',');
            for (const filename of attachmentFiles) {
                const filePath = path.join(__dirname, '../uploads/activities', filename);
                if (fs.existsSync(filePath)) {
                    try {
                        fs.unlinkSync(filePath);
                        console.log(`Deleted activity file: ${filename}`);
                    } catch (err) {
                        console.error(`Error deleting activity file ${filename}:`, err);
                    }
                }
            }
        }

        // Delete submission files
        for (const submission of submissions) {
            if (submission.file_path) {
                const filePath = path.join(__dirname, '../uploads/activities', submission.file_path);
                if (fs.existsSync(filePath)) {
                    try {
                        fs.unlinkSync(filePath);
                        console.log(`Deleted submission file: ${submission.file_path}`);
                    } catch (err) {
                        console.error(`Error deleting submission file ${submission.file_path}:`, err);
                    }
                }
            }
        }

        // Delete activity (submissions will be deleted due to CASCADE)
        const [result] = await pool.execute(
            'DELETE FROM Activities WHERE activity_id = ?',
            [activityId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Activity not found' });
        }

        res.json({ 
            message: 'Activity deleted successfully',
            files_deleted: (activity.attachment_path ? activity.attachment_path.split(',').length : 0) + submissions.length
        });

    } catch (error) {
        console.error('Delete activity error:', error);
        res.status(500).json({ error: 'Server error deleting activity' });
    }
};

// Submit work for activity (Student) - Blocked if archived - With file upload
const submitWork = async (req, res) => {
    try {
        const { activityId } = req.params;
        const { content } = req.body;
        const userId = req.user.user_id;
        const file = req.file;

        // Allow empty submissions for hardcopy/physical work
        // No validation required - students can submit without content or file

        // Check if activity exists, user has access, and get submission settings
        const [activities] = await pool.execute(`
            SELECT a.activity_id, a.class_id, a.deadline, a.title, a.is_accepting_submissions,
                   c.status as class_status,
                   e.is_archived as personal_archive, e.role
            FROM Activities a
            JOIN Classes c ON a.class_id = c.class_id
            JOIN Enrollments e ON a.class_id = e.class_id
            WHERE a.activity_id = ? AND e.user_id = ? AND e.status = 'Active'
        `, [activityId, userId]);

        if (activities.length === 0) {
            return res.status(404).json({ error: 'Activity not found or access denied' });
        }

        const activity = activities[0];

        // Verify user is a student
        if (activity.role !== 'Student') {
            return res.status(403).json({ error: 'Only students can submit work' });
        }

        // DUAL-LOCK HIERARCHY - Check in priority order:
        
        // Priority 1: Is the Toggle OFF? (Teacher Control)
        if (!activity.is_accepting_submissions) {
            return res.status(403).json({ 
                error: 'Submissions are closed',
                message: 'The teacher has closed submissions for this activity.',
                lock_type: 'toggle'
            });
        }

        // Priority 2: Is the Deadline Passed? (Automatic Time Lock)
        const now = new Date();
        const deadline = activity.deadline ? new Date(activity.deadline) : null;
        const isOverdue = deadline && now > deadline;
        
        if (isOverdue) {
            return res.status(403).json({ 
                error: 'Deadline has passed',
                message: `The deadline for this activity was ${deadline.toLocaleString()}. Submissions are no longer accepted.`,
                lock_type: 'deadline',
                deadline: activity.deadline
            });
        }

        // Priority 3: Is the Room Archived?
        if (activity.class_status === 'Archived' || activity.personal_archive === 1) {
            return res.status(403).json({ 
                error: 'Cannot submit work in archived classes',
                message: 'This class is in read-only mode. Submissions are not allowed.',
                lock_type: 'archive'
            });
        }

        // Prepare file path if file was uploaded
        const filePath = file ? file.filename : null;

        // Get file info for response
        let fileInfo = null;
        if (file) {
            fileInfo = {
                filename: file.filename,
                originalName: file.originalname,
                size: file.size,
                mimetype: file.mimetype
            };
        }

        // Insert or update submission (allow NULL content and file_path for hardcopy submissions)
        await pool.execute(`
            INSERT INTO Submissions (activity_id, user_id, content, file_path, submission_date)
            VALUES (?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE 
            content = VALUES(content),
            file_path = VALUES(file_path),
            submission_date = NOW()
        `, [activityId, userId, content || null, filePath]);

        res.json({ 
            message: 'Work submitted successfully',
            file_uploaded: !!file,
            has_content: !!content,
            file_info: fileInfo,
            submitted_at: new Date().toISOString()
        });

    } catch (error) {
        console.error('Submit work error:', error);
        res.status(500).json({ error: 'Server error submitting work' });
    }
};

// Grade submission (Teacher only) with notification
const gradeSubmission = async (req, res) => {
    try {
        const { submissionId } = req.params;
        const { score, feedback, max_score } = req.body;
        const teacherId = req.user.user_id;

        // Get submission details and activity info
        const [submissionDetails] = await pool.execute(`
            SELECT s.user_id, s.activity_id, a.title as activity_title, a.class_id, a.max_score as current_max_score
            FROM Submissions s
            JOIN Activities a ON s.activity_id = a.activity_id
            WHERE s.submission_id = ?
        `, [submissionId]);

        if (submissionDetails.length === 0) {
            return res.status(404).json({ error: 'Submission not found' });
        }

        const submission = submissionDetails[0];
        const activityMaxScore = max_score || submission.current_max_score || 100;

        // Validate score against the max score
        if (score !== null && (isNaN(score) || score < 0 || score > activityMaxScore)) {
            return res.status(400).json({ 
                error: `Score must be between 0 and ${activityMaxScore}`,
                max_score: activityMaxScore
            });
        }

        // Update activity max_score if provided
        if (max_score && max_score !== submission.current_max_score) {
            await pool.execute(
                'UPDATE Activities SET max_score = ? WHERE activity_id = ?',
                [max_score, submission.activity_id]
            );
        }

        // Update submission with grade and feedback
        const [result] = await pool.execute(
            'UPDATE Submissions SET score = ?, feedback = ? WHERE submission_id = ?',
            [score, feedback || null, submissionId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Submission not found' });
        }

        // Create notification for the student (only visible to them)
        if (score !== null) {
            await pool.execute(`
                INSERT INTO Notifications (user_id, type, title, message, related_id)
                VALUES (?, 'new_submission', ?, ?, ?)
            `, [
                submission.user_id,
                'Assignment Graded',
                `Your submission for "${submission.activity_title}" has been graded. Score: ${score}/${activityMaxScore}`,
                submissionId
            ]);
        }

        res.json({ 
            message: 'Submission graded successfully',
            max_score: activityMaxScore
        });

    } catch (error) {
        console.error('Grade submission error:', error);
        res.status(500).json({ error: 'Server error grading submission' });
    }
};

// Unsubmit work (Student only) - Reverts submission to draft mode
const unsubmitWork = async (req, res) => {
    try {
        const { activityId } = req.params;
        const userId = req.user.user_id;

        // Check if submission exists and user has access
        const [submissions] = await pool.execute(`
            SELECT s.submission_id, s.score, a.class_id, a.is_accepting_submissions,
                   c.status as class_status,
                   e.is_archived as personal_archive, e.role
            FROM Submissions s
            JOIN Activities a ON s.activity_id = a.activity_id
            JOIN Classes c ON a.class_id = c.class_id
            JOIN Enrollments e ON a.class_id = e.class_id
            WHERE s.activity_id = ? AND s.user_id = ? AND e.user_id = ? AND e.status = 'Active'
        `, [activityId, userId, userId]);

        if (submissions.length === 0) {
            return res.status(404).json({ error: 'Submission not found or access denied' });
        }

        const submission = submissions[0];

        // Verify user is a student
        if (submission.role !== 'Student') {
            return res.status(403).json({ error: 'Only students can unsubmit work' });
        }

        // DUAL-LOCK HIERARCHY - Check in priority order:
        
        // Priority 1: Is the Toggle OFF? (Teacher Control)
        if (!submission.is_accepting_submissions) {
            return res.status(403).json({ 
                error: 'Submissions are closed',
                message: 'The teacher has closed submissions for this activity. You cannot unsubmit at this time.',
                lock_type: 'toggle'
            });
        }

        // Priority 2: Check if submission has been graded (grading lock)
        if (submission.score !== null) {
            return res.status(403).json({ 
                error: 'Cannot unsubmit graded work',
                message: 'Your submission has been graded and is now locked.',
                lock_type: 'graded'
            });
        }

        // Priority 3: Is the Deadline Passed? (Automatic Time Lock)
        const [activityInfo] = await pool.execute(
            'SELECT deadline FROM Activities WHERE activity_id = ?',
            [activityId]
        );
        
        if (activityInfo.length > 0 && activityInfo[0].deadline) {
            const now = new Date();
            const deadline = new Date(activityInfo[0].deadline);
            if (now > deadline) {
                return res.status(403).json({ 
                    error: 'Deadline has passed',
                    message: `The deadline for this activity was ${deadline.toLocaleString()}. You cannot unsubmit after the deadline.`,
                    lock_type: 'deadline',
                    deadline: activityInfo[0].deadline
                });
            }
        }

        // Priority 4: Is the Room Archived?
        if (submission.class_status === 'Archived' || submission.personal_archive === 1) {
            return res.status(403).json({ 
                error: 'Cannot unsubmit work in archived classes',
                message: 'This class is in read-only mode.',
                lock_type: 'archive'
            });
        }

        // Delete the submission (revert to draft mode)
        await pool.execute(
            'DELETE FROM Submissions WHERE submission_id = ?',
            [submission.submission_id]
        );

        res.json({ 
            message: 'Submission reverted to draft mode',
            can_resubmit: true
        });

    } catch (error) {
        console.error('Unsubmit work error:', error);
        res.status(500).json({ error: 'Server error unsubmitting work' });
    }
};

// Download activity attachment file
const downloadFile = async (req, res) => {
    try {
        const { activityId, filename } = req.params;
        const userId = req.user.user_id;

        // Verify user has access to this activity
        const [access] = await pool.execute(`
            SELECT a.activity_id, a.attachment_path
            FROM Activities a
            JOIN Enrollments e ON a.class_id = e.class_id
            WHERE a.activity_id = ? AND e.user_id = ? AND e.status = 'Active'
        `, [activityId, userId]);

        if (access.length === 0) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Verify filename is in the activity's attachments
        const attachments = access[0].attachment_path ? access[0].attachment_path.split(',') : [];
        if (!attachments.includes(filename)) {
            return res.status(404).json({ error: 'File not found' });
        }

        // Send file
        const filePath = path.join(__dirname, '../uploads/activities', filename);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'File not found on server' });
        }

        res.download(filePath);

    } catch (error) {
        console.error('Download file error:', error);
        res.status(500).json({ error: 'Server error downloading file' });
    }
};

// Download submission file (Teacher or student who submitted)
const downloadSubmissionFile = async (req, res) => {
    try {
        const { submissionId } = req.params;
        const userId = req.user.user_id;

        // Get submission details and verify access
        const [submissions] = await pool.execute(`
            SELECT s.file_path, s.user_id, a.class_id, e.role
            FROM Submissions s
            JOIN Activities a ON s.activity_id = a.activity_id
            JOIN Enrollments e ON a.class_id = e.class_id AND e.user_id = ?
            WHERE s.submission_id = ? AND e.status = 'Active'
        `, [userId, submissionId]);

        if (submissions.length === 0) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const submission = submissions[0];

        // Check if user is the submitter or a teacher
        if (submission.user_id !== userId && submission.role !== 'Teacher') {
            return res.status(403).json({ error: 'Access denied' });
        }

        if (!submission.file_path) {
            return res.status(404).json({ error: 'No file attached to this submission' });
        }

        // Send file
        const filePath = path.join(__dirname, '../uploads/activities', submission.file_path);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'File not found on server' });
        }

        res.download(filePath);

    } catch (error) {
        console.error('Download submission file error:', error);
        res.status(500).json({ error: 'Server error downloading file' });
    }
};

// Get submission details for grading (Teacher only)
const getSubmissionDetails = async (req, res) => {
    try {
        const { submissionId } = req.params;
        const userId = req.user.user_id;

        // Get submission with activity details
        const [submissions] = await pool.execute(`
            SELECT s.submission_id, s.content, s.file_path, s.score, s.feedback, 
                   s.submission_date, s.user_id,
                   a.activity_id, a.title as activity_title, a.max_score, a.class_id,
                   u.name as student_name, u.email as student_email,
                   e.role
            FROM Submissions s
            JOIN Activities a ON s.activity_id = a.activity_id
            JOIN Users u ON s.user_id = u.user_id
            JOIN Enrollments e ON a.class_id = e.class_id AND e.user_id = ?
            WHERE s.submission_id = ? AND e.status = 'Active'
        `, [userId, submissionId]);

        if (submissions.length === 0) {
            return res.status(404).json({ error: 'Submission not found or access denied' });
        }

        const submission = submissions[0];

        // Verify user is a teacher
        if (submission.role !== 'Teacher') {
            return res.status(403).json({ error: 'Only teachers can access submission details for grading' });
        }

        res.json({
            submission: {
                submission_id: submission.submission_id,
                content: submission.content,
                file_path: submission.file_path,
                score: submission.score,
                feedback: submission.feedback,
                submission_date: submission.submission_date,
                student_name: submission.student_name,
                student_email: submission.student_email
            },
            activity: {
                activity_id: submission.activity_id,
                title: submission.activity_title
            },
            max_score: submission.max_score || 100
        });

    } catch (error) {
        console.error('Get submission details error:', error);
        res.status(500).json({ error: 'Server error fetching submission details' });
    }
};

module.exports = {
    createActivity,
    getClassActivities,
    getActivityDetails,
    updateActivity,
    deleteActivity,
    submitWork,
    gradeSubmission,
    unsubmitWork,
    uploadFiles,
    uploadSubmissionFile,
    downloadFile,
    downloadSubmissionFile,
    getSubmissionDetails
};