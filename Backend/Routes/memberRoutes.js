// Member Management Routes
const express = require('express');
const router = express.Router();
const { 
    authenticateToken, 
    requireTeacherRole 
} = require('../middleware/auth');
const {
    kickMember,
    submitJoinRequest,
    handleJoinRequest,
    getPendingJoinRequests
} = require('../Controllers/memberController');

// All routes require authentication
router.use(authenticateToken);

// Member management routes
router.post('/classes/:classId/kick', requireTeacherRole, kickMember);           // Kick member
router.post('/classes/:classId/join-request', submitJoinRequest);               // Submit join request
router.put('/join-requests/:requestId', handleJoinRequest);                     // Handle join request
router.get('/join-requests/pending', getPendingJoinRequests);                   // Get pending requests

module.exports = router;