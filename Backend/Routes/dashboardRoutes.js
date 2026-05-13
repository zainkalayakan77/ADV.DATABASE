// Dashboard Routes
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
    getDashboardStats,
    getPerformanceAnalytics,
    getTeacherAnalytics
} = require('../Controllers/dashboardController');

// All routes require authentication
router.use(authenticateToken);

// Dashboard routes
router.get('/stats', getDashboardStats);                    // Get dashboard statistics
router.get('/performance', getPerformanceAnalytics);        // Get performance analytics
router.get('/teacher-analytics', getTeacherAnalytics);      // Get teacher analytics

module.exports = router;