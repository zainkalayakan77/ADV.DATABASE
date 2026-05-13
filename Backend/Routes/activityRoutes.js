// Activity Management Routes
const express = require('express');
const router = express.Router();
const { 
    authenticateToken, 
    requireTeacherRole, 
    requireClassAccess 
} = require('../middleware/auth');
const {
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
} = require('../Controllers/activityController');

// All routes require authentication
router.use(authenticateToken);

// Activity CRUD routes with file upload support
router.post('/class/:classId', requireTeacherRole, uploadFiles, createActivity);  // Create activity with files
router.get('/class/:classId', requireClassAccess, getClassActivities);           // Get class activities
router.get('/:activityId', getActivityDetails);                                  // Get activity details
router.get('/:activityId/download/:filename', downloadFile);                     // Download activity file
router.put('/:activityId', uploadFiles, updateActivity);                         // Update activity with file upload (teacher check in controller)
router.delete('/:activityId', deleteActivity);                                   // Delete activity (teacher check in controller)

// Submission routes
router.post('/:activityId/submit', uploadSubmissionFile, submitWork);            // Submit work with file
router.post('/:activityId/unsubmit', unsubmitWork);                              // Unsubmit work (revert to draft)
router.get('/submissions/:submissionId/details', getSubmissionDetails);          // Get submission details for grading
router.get('/submissions/:submissionId/download', downloadSubmissionFile);       // Download submission file
router.put('/submissions/:submissionId/grade', gradeSubmission);                 // Grade submission (teacher check in controller)

module.exports = router;