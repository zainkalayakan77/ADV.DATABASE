// Report Controller - Generates comprehensive reports using advanced SQL
const { pool } = require('../config/database');

// Generate student performance report
const getStudentPerformanceReport = async (req, res) => {
    try {
        const { classId } = req.query;
        const userId = req.user.user_id;

        // Verify user has access to the class AND is the creator (if classId provided)
        if (classId) {
            const [access] = await pool.execute(
                `SELECT e.role, c.created_by 
                 FROM Enrollments e
                 JOIN Classes c ON e.class_id = c.class_id
                 WHERE e.user_id = ? AND e.class_id = ?`,
                [userId, classId]
            );
            
            if (access.length === 0) {
                return res.status(403).json({ error: 'Access denied to this class' });
            }
            
            // Only allow room creators to view reports
            if (access[0].created_by !== userId) {
                return res.status(403).json({ 
                    error: 'Reports are only available for rooms you created',
                    message: 'You can only view reports for classes where you are the creator.'
                });
            }
        }

        // Build query with optional class filter - ONLY show classes created by user
        let whereClause = 'WHERE c.created_by = ?';
        let params = [userId];
        
        if (classId) {
            whereClause += ' AND c.class_id = ?';
            params.push(classId);
        }

        // Student performance report using CTE and advanced aggregations
        const [performanceReport] = await pool.execute(`
            WITH StudentStats AS (
                SELECT u.user_id, u.name, u.email, c.class_id, c.class_name,
                       COUNT(s.submission_id) as total_submissions,
                       AVG(s.score) as average_score,
                       MAX(s.score) as highest_score,
                       MIN(s.score) as lowest_score,
                       COUNT(CASE WHEN s.score >= 90 THEN 1 END) as excellent_scores,
                       COUNT(CASE WHEN s.score >= 80 AND s.score < 90 THEN 1 END) as good_scores,
                       COUNT(CASE WHEN s.score >= 70 AND s.score < 80 THEN 1 END) as average_scores,
                       COUNT(CASE WHEN s.score < 70 AND s.score IS NOT NULL THEN 1 END) as below_average_scores,
                       COUNT(CASE WHEN s.score IS NULL THEN 1 END) as ungraded_submissions
                FROM Users u
                JOIN Enrollments e ON u.user_id = e.user_id AND e.role = 'Student'
                JOIN Classes c ON e.class_id = c.class_id
                LEFT JOIN Activities a ON c.class_id = a.class_id
                LEFT JOIN Submissions s ON a.activity_id = s.activity_id AND s.user_id = u.user_id
                ${whereClause}
                GROUP BY u.user_id, u.name, u.email, c.class_id, c.class_name
            ),
            ClassAverages AS (
                SELECT class_id, AVG(average_score) as class_average
                FROM StudentStats
                WHERE average_score IS NOT NULL
                GROUP BY class_id
            )
            SELECT ss.*, ca.class_average,
                   CASE 
                       WHEN ss.average_score > ca.class_average THEN 'Above Average'
                       WHEN ss.average_score = ca.class_average THEN 'Average'
                       WHEN ss.average_score < ca.class_average THEN 'Below Average'
                       ELSE 'No Grades'
                   END as performance_category,
                   RANK() OVER (PARTITION BY ss.class_id ORDER BY ss.average_score DESC) as class_rank
            FROM StudentStats ss
            LEFT JOIN ClassAverages ca ON ss.class_id = ca.class_id
            ORDER BY ss.class_name, ss.average_score DESC
        `, params);

        res.json({
            report_type: 'Student Performance Report',
            generated_at: new Date().toISOString(),
            class_filter: classId || 'All Your Classes',
            data: performanceReport,
            ownership_note: 'Showing only classes you created'
        });

    } catch (error) {
        console.error('Student performance report error:', error);
        res.status(500).json({ error: 'Server error generating student performance report' });
    }
};

// Generate activity analysis report
const getActivityAnalysisReport = async (req, res) => {
    try {
        const { classId } = req.query;
        const userId = req.user.user_id;

        // Verify access if classId provided - must be creator
        if (classId) {
            const [access] = await pool.execute(
                `SELECT e.role, c.created_by 
                 FROM Enrollments e
                 JOIN Classes c ON e.class_id = c.class_id
                 WHERE e.user_id = ? AND e.class_id = ?`,
                [userId, classId]
            );
            
            if (access.length === 0) {
                return res.status(403).json({ error: 'Access denied to this class' });
            }
            
            // Only allow room creators to view reports
            if (access[0].created_by !== userId) {
                return res.status(403).json({ 
                    error: 'Reports are only available for rooms you created',
                    message: 'You can only view reports for classes where you are the creator.'
                });
            }
        }

        // Build query - ONLY show classes created by user
        let whereClause = 'WHERE c.created_by = ?';
        let params = [userId];
        
        if (classId) {
            whereClause += ' AND c.class_id = ?';
            params.push(classId);
        }

        // Activity analysis using subqueries and aggregations
        const [activityReport] = await pool.execute(`
            SELECT a.activity_id, a.title, c.class_name, a.deadline,
                   COUNT(DISTINCT e.user_id) as total_students,
                   COUNT(DISTINCT s.submission_id) as submissions_received,
                   ROUND((COUNT(DISTINCT s.submission_id) * 100.0 / COUNT(DISTINCT e.user_id)), 2) as completion_rate,
                   AVG(s.score) as average_score,
                   MAX(s.score) as highest_score,
                   MIN(s.score) as lowest_score,
                   STDDEV(s.score) as score_std_deviation,
                   COUNT(CASE WHEN s.score >= 90 THEN 1 END) as excellent_count,
                   COUNT(CASE WHEN s.score >= 80 AND s.score < 90 THEN 1 END) as good_count,
                   COUNT(CASE WHEN s.score >= 70 AND s.score < 80 THEN 1 END) as average_count,
                   COUNT(CASE WHEN s.score < 70 AND s.score IS NOT NULL THEN 1 END) as below_average_count,
                   COUNT(CASE WHEN s.score IS NULL THEN 1 END) as ungraded_count,
                   -- Subquery: Check if this activity has above average completion rate
                   CASE WHEN (COUNT(DISTINCT s.submission_id) * 100.0 / COUNT(DISTINCT e.user_id)) > 
                        (SELECT AVG(completion_rates.rate) FROM (
                            SELECT (COUNT(DISTINCT s2.submission_id) * 100.0 / COUNT(DISTINCT e2.user_id)) as rate
                            FROM Activities a2
                            JOIN Classes c2 ON a2.class_id = c2.class_id
                            JOIN Enrollments e2 ON c2.class_id = e2.class_id AND e2.role = 'Student'
                            LEFT JOIN Submissions s2 ON a2.activity_id = s2.activity_id AND s2.user_id = e2.user_id
                            WHERE c2.created_by = ?
                            GROUP BY a2.activity_id
                        ) as completion_rates)
                   THEN 'High Engagement' 
                   ELSE 'Low Engagement' 
                   END as engagement_level
            FROM Activities a
            JOIN Classes c ON a.class_id = c.class_id
            JOIN Enrollments e ON c.class_id = e.class_id AND e.role = 'Student'
            LEFT JOIN Submissions s ON a.activity_id = s.activity_id AND s.user_id = e.user_id
            ${whereClause}
            GROUP BY a.activity_id, a.title, c.class_name, a.deadline
            ORDER BY completion_rate DESC, average_score DESC
        `, [...params, userId]);

        res.json({
            report_type: 'Activity Analysis Report',
            generated_at: new Date().toISOString(),
            class_filter: classId || 'All Your Classes',
            data: activityReport,
            ownership_note: 'Showing only classes you created'
        });

    } catch (error) {
        console.error('Activity analysis report error:', error);
        res.status(500).json({ error: 'Server error generating activity analysis report' });
    }
};

// Generate class overview report
const getClassOverviewReport = async (req, res) => {
    try {
        const userId = req.user.user_id;

        // Class overview with comprehensive statistics
        const [classReport] = await pool.execute(`
            WITH ClassStats AS (
                SELECT c.class_id, c.class_name, c.class_code, c.created_at,
                       creator.name as created_by_name,
                       COUNT(DISTINCT CASE WHEN e.role = 'Teacher' THEN e.user_id END) as teacher_count,
                       COUNT(DISTINCT CASE WHEN e.role = 'Student' THEN e.user_id END) as student_count,
                       COUNT(DISTINCT a.activity_id) as total_activities,
                       COUNT(DISTINCT s.submission_id) as total_submissions,
                       AVG(s.score) as class_average_score,
                       MAX(s.score) as highest_score_in_class,
                       MIN(s.score) as lowest_score_in_class
                FROM Classes c
                JOIN Users creator ON c.created_by = creator.user_id
                JOIN Enrollments e_access ON c.class_id = e_access.class_id AND e_access.user_id = ?
                LEFT JOIN Enrollments e ON c.class_id = e.class_id
                LEFT JOIN Activities a ON c.class_id = a.class_id
                LEFT JOIN Submissions s ON a.activity_id = s.activity_id
                GROUP BY c.class_id, c.class_name, c.class_code, c.created_at, creator.name
            ),
            ActivityDeadlines AS (
                SELECT c.class_id,
                       COUNT(CASE WHEN a.deadline < NOW() THEN 1 END) as overdue_activities,
                       COUNT(CASE WHEN a.deadline >= NOW() THEN 1 END) as upcoming_activities
                FROM Classes c
                JOIN Enrollments e ON c.class_id = e.class_id AND e.user_id = ?
                LEFT JOIN Activities a ON c.class_id = a.class_id
                GROUP BY c.class_id
            )
            SELECT cs.*, ad.overdue_activities, ad.upcoming_activities,
                   ROUND((cs.total_submissions * 100.0 / NULLIF(cs.total_activities * cs.student_count, 0)), 2) as overall_completion_rate
            FROM ClassStats cs
            LEFT JOIN ActivityDeadlines ad ON cs.class_id = ad.class_id
            ORDER BY cs.class_name
        `, [userId, userId]);

        res.json({
            report_type: 'Class Overview Report',
            generated_at: new Date().toISOString(),
            data: classReport
        });

    } catch (error) {
        console.error('Class overview report error:', error);
        res.status(500).json({ error: 'Server error generating class overview report' });
    }
};

// Generate submission trends report
const getSubmissionTrendsReport = async (req, res) => {
    try {
        const { days = 30 } = req.query;
        const userId = req.user.user_id;

        // Submission trends over time
        const [trendsReport] = await pool.execute(`
            SELECT DATE(s.submission_date) as submission_date,
                   COUNT(s.submission_id) as daily_submissions,
                   AVG(s.score) as daily_average_score,
                   COUNT(DISTINCT s.user_id) as unique_students,
                   COUNT(DISTINCT a.activity_id) as activities_with_submissions,
                   -- Rolling 7-day average
                   AVG(COUNT(s.submission_id)) OVER (
                       ORDER BY DATE(s.submission_date) 
                       ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
                   ) as rolling_7day_avg
            FROM Submissions s
            JOIN Activities a ON s.activity_id = a.activity_id
            JOIN Enrollments e ON a.class_id = e.class_id AND e.user_id = ?
            WHERE s.submission_date >= DATE_SUB(NOW(), INTERVAL ? DAY)
            GROUP BY DATE(s.submission_date)
            ORDER BY submission_date DESC
        `, [userId, parseInt(days)]);

        // Peak submission hours
        const [peakHours] = await pool.execute(`
            SELECT HOUR(s.submission_date) as hour_of_day,
                   COUNT(s.submission_id) as submission_count,
                   AVG(s.score) as average_score_by_hour
            FROM Submissions s
            JOIN Activities a ON s.activity_id = a.activity_id
            JOIN Enrollments e ON a.class_id = e.class_id AND e.user_id = ?
            WHERE s.submission_date >= DATE_SUB(NOW(), INTERVAL ? DAY)
            GROUP BY HOUR(s.submission_date)
            ORDER BY submission_count DESC
        `, [userId, parseInt(days)]);

        res.json({
            report_type: 'Submission Trends Report',
            generated_at: new Date().toISOString(),
            period_days: parseInt(days),
            daily_trends: trendsReport,
            peak_hours: peakHours
        });

    } catch (error) {
        console.error('Submission trends report error:', error);
        res.status(500).json({ error: 'Server error generating submission trends report' });
    }
};

module.exports = {
    getStudentPerformanceReport,
    getActivityAnalysisReport,
    getClassOverviewReport,
    getSubmissionTrendsReport
};