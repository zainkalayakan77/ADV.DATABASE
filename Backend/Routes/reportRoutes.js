// Report Generation Routes
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
    getStudentPerformanceReport,
    getActivityAnalysisReport,
    getClassOverviewReport,
    getSubmissionTrendsReport
} = require('../Controllers/reportController');

// All routes require authentication
router.use(authenticateToken);

// Report routes
router.get('/student-performance', getStudentPerformanceReport);    // Student performance report
router.get('/activity-analysis', getActivityAnalysisReport);        // Activity analysis report
router.get('/class-overview', getClassOverviewReport);              // Class overview report
router.get('/submission-trends', getSubmissionTrendsReport);        // Submission trends report

module.exports = router;