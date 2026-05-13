// Dashboard Controller - Provides analytics and summary data
const { pool } = require('../config/database');

// Get dashboard statistics for current user
const getDashboardStats = async (req, res) => {
    try {
        const userId = req.user.user_id;

        // Get basic counts using aggregation functions (only active enrollments)
        // Removed average_score, pending_grades, and submissions_made for performance optimization
        const [stats] = await pool.execute(`
            SELECT 
                COUNT(DISTINCT CASE WHEN e.role = 'Teacher' AND e.status = 'Active' THEN e.class_id END) as classes_teaching,
                COUNT(DISTINCT CASE WHEN e.role = 'Student' AND e.status = 'Active' THEN e.class_id END) as classes_enrolled,
                COUNT(DISTINCT CASE WHEN e.role = 'Teacher' AND e.status = 'Active' THEN a.activity_id END) as activities_created
            FROM Users u
            LEFT JOIN Enrollments e ON u.user_id = e.user_id
            LEFT JOIN Activities a ON e.class_id = a.class_id AND e.role = 'Teacher'
            WHERE u.user_id = ?
            GROUP BY u.user_id
        `, [userId]);

        // Get recent activities for classes user is enrolled in (active enrollment only)
        const [recentActivities] = await pool.execute(`
            SELECT a.activity_id, a.title, a.deadline, c.class_name, c.class_id,
                   s.submission_id, s.score, s.submission_date,
                   CASE 
                       WHEN s.submission_id IS NOT NULL THEN 'Submitted'
                       WHEN a.deadline < NOW() THEN 'Overdue'
                       ELSE 'Pending'
                   END as status
            FROM Activities a
            JOIN Classes c ON a.class_id = c.class_id
            JOIN Enrollments e ON c.class_id = e.class_id
            LEFT JOIN Submissions s ON a.activity_id = s.activity_id AND s.user_id = ?
            WHERE e.user_id = ? AND e.role = 'Student' AND e.status = 'Active'
            ORDER BY a.deadline ASC, a.created_at DESC
            LIMIT 10
        `, [userId, userId]);

        // Get classes with activity counts (active enrollments only)
        const [classesOverview] = await pool.execute(`
            SELECT c.class_id, c.class_name, e.role,
                   COUNT(DISTINCT a.activity_id) as total_activities,
                   COUNT(DISTINCT CASE WHEN e.role = 'Student' AND s.submission_id IS NOT NULL THEN s.submission_id END) as completed_submissions,
                   COUNT(DISTINCT e2.user_id) as total_members
            FROM Classes c
            JOIN Enrollments e ON c.class_id = e.class_id
            LEFT JOIN Activities a ON c.class_id = a.class_id
            LEFT JOIN Submissions s ON a.activity_id = s.activity_id AND s.user_id = ?
            LEFT JOIN Enrollments e2 ON c.class_id = e2.class_id AND e2.status = 'Active'
            WHERE e.user_id = ? AND e.status = 'Active'
            GROUP BY c.class_id, c.class_name, e.role
            ORDER BY c.class_name
        `, [userId, userId]);

        res.json({
            stats: stats[0] || {
                classes_teaching: 0,
                classes_enrolled: 0,
                activities_created: 0
            },
            recent_activities: recentActivities,
            classes_overview: classesOverview
        });

    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ error: 'Server error fetching dashboard data' });
    }
};

// Get performance analytics (for teachers and students)
const getPerformanceAnalytics = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { classId } = req.query;

        let whereClause = '';
        let params = [userId];

        if (classId) {
            whereClause = 'AND c.class_id = ?';
            params.push(classId);
        }

        // Performance data using CTE and aggregation functions
        const [performanceData] = await pool.execute(`
            WITH StudentPerformance AS (
                SELECT c.class_id, c.class_name, 
                       AVG(s.score) as avg_score,
                       COUNT(s.submission_id) as total_submissions,
                       MAX(s.score) as best_score,
                       MIN(s.score) as lowest_score,
                       COUNT(CASE WHEN s.score >= 90 THEN 1 END) as excellent_count,
                       COUNT(CASE WHEN s.score >= 80 AND s.score < 90 THEN 1 END) as good_count,
                       COUNT(CASE WHEN s.score >= 70 AND s.score < 80 THEN 1 END) as average_count,
                       COUNT(CASE WHEN s.score < 70 THEN 1 END) as below_average_count
                FROM Classes c
                JOIN Enrollments e ON c.class_id = e.class_id
                JOIN Activities a ON c.class_id = a.class_id
                LEFT JOIN Submissions s ON a.activity_id = s.activity_id AND s.user_id = ?
                WHERE e.user_id = ? ${whereClause}
                GROUP BY c.class_id, c.class_name
            )
            SELECT * FROM StudentPerformance
            ORDER BY avg_score DESC
        `, params);

        // Get submission trends (last 30 days)
        const [submissionTrends] = await pool.execute(`
            SELECT DATE(s.submission_date) as submission_date,
                   COUNT(s.submission_id) as submissions_count,
                   AVG(s.score) as avg_score_day
            FROM Submissions s
            JOIN Activities a ON s.activity_id = a.activity_id
            JOIN Enrollments e ON a.class_id = e.class_id
            WHERE e.user_id = ? AND s.submission_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY DATE(s.submission_date)
            ORDER BY submission_date DESC
        `, [userId]);

        res.json({
            performance_by_class: performanceData,
            submission_trends: submissionTrends
        });

    } catch (error) {
        console.error('Performance analytics error:', error);
        res.status(500).json({ error: 'Server error fetching performance analytics' });
    }
};

// Get teacher analytics (for teachers only)
const getTeacherAnalytics = async (req, res) => {
    try {
        const userId = req.user.user_id;

        // Get classes where user is teacher
        const [teachingClasses] = await pool.execute(`
            SELECT c.class_id, c.class_name,
                   COUNT(DISTINCT e.user_id) as total_students,
                   COUNT(DISTINCT a.activity_id) as total_activities,
                   COUNT(DISTINCT s.submission_id) as total_submissions,
                   COUNT(DISTINCT CASE WHEN s.score IS NULL THEN s.submission_id END) as pending_grades,
                   AVG(s.score) as class_average
            FROM Classes c
            JOIN Enrollments e_teacher ON c.class_id = e_teacher.class_id AND e_teacher.role = 'Teacher'
            LEFT JOIN Enrollments e ON c.class_id = e.class_id AND e.role = 'Student'
            LEFT JOIN Activities a ON c.class_id = a.class_id
            LEFT JOIN Submissions s ON a.activity_id = s.activity_id
            WHERE e_teacher.user_id = ?
            GROUP BY c.class_id, c.class_name
            ORDER BY c.class_name
        `, [userId]);

        // Get activity performance across all teaching classes
        const [activityPerformance] = await pool.execute(`
            SELECT a.activity_id, a.title, c.class_name,
                   COUNT(DISTINCT s.submission_id) as submission_count,
                   COUNT(DISTINCT e.user_id) as total_students,
                   ROUND((COUNT(DISTINCT s.submission_id) * 100.0 / COUNT(DISTINCT e.user_id)), 2) as completion_rate,
                   AVG(s.score) as average_score,
                   MAX(s.score) as highest_score,
                   MIN(s.score) as lowest_score
            FROM Activities a
            JOIN Classes c ON a.class_id = c.class_id
            JOIN Enrollments e_teacher ON c.class_id = e_teacher.class_id AND e_teacher.role = 'Teacher'
            JOIN Enrollments e ON c.class_id = e.class_id AND e.role = 'Student'
            LEFT JOIN Submissions s ON a.activity_id = s.activity_id AND s.user_id = e.user_id
            WHERE e_teacher.user_id = ?
            GROUP BY a.activity_id, a.title, c.class_name
            ORDER BY completion_rate DESC, average_score DESC
        `, [userId]);

        res.json({
            teaching_classes: teachingClasses,
            activity_performance: activityPerformance
        });

    } catch (error) {
        console.error('Teacher analytics error:', error);
        res.status(500).json({ error: 'Server error fetching teacher analytics' });
    }
};

module.exports = {
    getDashboardStats,
    getPerformanceAnalytics,
    getTeacherAnalytics
};