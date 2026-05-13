-- Advanced SQL Queries for Student Activity Tracker
-- Demonstrates AGGREGATION, JOINS, SUBQUERIES, and CTE usage

-- 1. AGGREGATION FUNCTIONS Examples

-- Count total classes per user (as teacher)
SELECT u.name, COUNT(c.class_id) as total_classes_created
FROM Users u
LEFT JOIN Classes c ON u.user_id = c.created_by
GROUP BY u.user_id, u.name;

-- Average score per activity
SELECT a.title, AVG(s.score) as average_score, COUNT(s.submission_id) as total_submissions
FROM Activities a
LEFT JOIN Submissions s ON a.activity_id = s.activity_id
GROUP BY a.activity_id, a.title;

-- Maximum and minimum scores per class
SELECT c.class_name, 
       MAX(s.score) as highest_score, 
       MIN(s.score) as lowest_score,
       SUM(CASE WHEN s.score IS NOT NULL THEN 1 ELSE 0 END) as graded_submissions
FROM Classes c
JOIN Activities a ON c.class_id = a.class_id
LEFT JOIN Submissions s ON a.activity_id = s.activity_id
GROUP BY c.class_id, c.class_name;

-- 2. JOIN QUERIES Examples

-- Users with their enrollments and class details
SELECT u.name as user_name, u.email, c.class_name, e.role, e.enrolled_at
FROM Users u
JOIN Enrollments e ON u.user_id = e.user_id
JOIN Classes c ON e.class_id = c.class_id
ORDER BY u.name, c.class_name;

-- Activities with submission details and user information
SELECT a.title as activity_title, c.class_name, u.name as student_name, 
       s.score, s.feedback, s.submission_date
FROM Activities a
JOIN Classes c ON a.class_id = c.class_id
LEFT JOIN Submissions s ON a.activity_id = s.activity_id
LEFT JOIN Users u ON s.user_id = u.user_id
ORDER BY a.title, s.score DESC;

-- 3. SUBQUERIES (≥3 examples)

-- Subquery 1: Students with above-average scores
SELECT u.name, s.score, a.title
FROM Users u
JOIN Submissions s ON u.user_id = s.user_id
JOIN Activities a ON s.activity_id = a.activity_id
WHERE s.score > (
    SELECT AVG(score) 
    FROM Submissions 
    WHERE score IS NOT NULL
);

-- Subquery 2: Latest submission per user per activity
SELECT u.name, a.title, s.content, s.submission_date
FROM Users u
JOIN Submissions s ON u.user_id = s.user_id
JOIN Activities a ON s.activity_id = a.activity_id
WHERE s.submission_date = (
    SELECT MAX(s2.submission_date)
    FROM Submissions s2
    WHERE s2.user_id = s.user_id AND s2.activity_id = s.activity_id
);

-- Subquery 3: Activities with the most submissions
SELECT a.title, c.class_name, 
       (SELECT COUNT(*) FROM Submissions s WHERE s.activity_id = a.activity_id) as submission_count
FROM Activities a
JOIN Classes c ON a.class_id = c.class_id
WHERE (SELECT COUNT(*) FROM Submissions s WHERE s.activity_id = a.activity_id) = (
    SELECT MAX(sub_count) FROM (
        SELECT COUNT(*) as sub_count
        FROM Submissions
        GROUP BY activity_id
    ) as counts
);

-- 4. CTE (Common Table Expression) Example

-- CTE: Calculate average score per student across all activities
WITH StudentAverages AS (
    SELECT u.user_id, u.name, u.email,
           AVG(s.score) as average_score,
           COUNT(s.submission_id) as total_submissions,
           COUNT(CASE WHEN s.score >= 90 THEN 1 END) as excellent_scores
    FROM Users u
    LEFT JOIN Submissions s ON u.user_id = s.user_id
    WHERE s.score IS NOT NULL
    GROUP BY u.user_id, u.name, u.email
),
ClassEnrollments AS (
    SELECT u.user_id, COUNT(e.enrollment_id) as classes_enrolled
    FROM Users u
    LEFT JOIN Enrollments e ON u.user_id = e.user_id
    WHERE e.role = 'Student'
    GROUP BY u.user_id
)
SELECT sa.name, sa.email, sa.average_score, sa.total_submissions, 
       sa.excellent_scores, ce.classes_enrolled,
       CASE 
           WHEN sa.average_score >= 90 THEN 'Excellent'
           WHEN sa.average_score >= 80 THEN 'Good'
           WHEN sa.average_score >= 70 THEN 'Average'
           ELSE 'Needs Improvement'
       END as performance_category
FROM StudentAverages sa
LEFT JOIN ClassEnrollments ce ON sa.user_id = ce.user_id
ORDER BY sa.average_score DESC;

-- 5. REPORTING QUERIES

-- Student performance report per class
SELECT c.class_name, u.name as student_name, 
       COUNT(s.submission_id) as submissions_made,
       AVG(s.score) as average_score,
       MAX(s.score) as best_score,
       MIN(s.score) as lowest_score
FROM Classes c
JOIN Enrollments e ON c.class_id = e.class_id AND e.role = 'Student'
JOIN Users u ON e.user_id = u.user_id
LEFT JOIN Activities a ON c.class_id = a.class_id
LEFT JOIN Submissions s ON a.activity_id = s.activity_id AND s.user_id = u.user_id
GROUP BY c.class_id, c.class_name, u.user_id, u.name
ORDER BY c.class_name, average_score DESC;

-- Activity completion rates
SELECT a.title, c.class_name,
       COUNT(DISTINCT e.user_id) as total_students,
       COUNT(DISTINCT s.user_id) as students_submitted,
       ROUND((COUNT(DISTINCT s.user_id) * 100.0 / COUNT(DISTINCT e.user_id)), 2) as completion_rate
FROM Activities a
JOIN Classes c ON a.class_id = c.class_id
JOIN Enrollments e ON c.class_id = e.class_id AND e.role = 'Student'
LEFT JOIN Submissions s ON a.activity_id = s.activity_id AND s.user_id = e.user_id
GROUP BY a.activity_id, a.title, c.class_name
ORDER BY completion_rate DESC;

-- Teacher workload analysis
SELECT u.name as teacher_name,
       COUNT(DISTINCT c.class_id) as classes_teaching,
       COUNT(DISTINCT a.activity_id) as activities_created,
       COUNT(DISTINCT s.submission_id) as submissions_to_grade,
       AVG(s.score) as average_score_given
FROM Users u
JOIN Enrollments e ON u.user_id = e.user_id AND e.role = 'Teacher'
JOIN Classes c ON e.class_id = c.class_id
LEFT JOIN Activities a ON c.class_id = a.class_id
LEFT JOIN Submissions s ON a.activity_id = s.activity_id
GROUP BY u.user_id, u.name
ORDER BY classes_teaching DESC;