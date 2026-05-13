// Class Management Routes
const express = require('express');
const router = express.Router();
const { 
    authenticateToken, 
    requireTeacherRole, 
    requireClassAccess 
} = require('../middleware/auth');
const {
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
} = require('../Controllers/classController');

// All routes require authentication
router.use(authenticateToken);

// Class management routes
router.post('/', createClass);                                    // Create new class
router.post('/join', joinClass);                                  // Join class via code
router.get('/', getUserClasses);                                  // Get user's classes
router.get('/archived', getArchivedClasses);                      // Get archived classes
router.get('/:classId', requireClassAccess, getClassDetails);     // Get class details

// Member management routes (Teacher only)
router.put('/:classId/members', requireTeacherRole, updateMemberRole);  // Update member role

// Archive/Delete routes (Teacher only)
router.put('/:classId/archive', requireClassAccess, archiveClass);      // Archive class
router.put('/:classId/unarchive', requireClassAccess, unarchiveClass);  // Unarchive class
router.delete('/:classId', requireClassAccess, deleteClass);            // Delete class permanently

// Student-specific routes
router.put('/:classId/archive-personal', requireClassAccess, archivePersonal);    // Personal archive
router.put('/:classId/unarchive-personal', requireClassAccess, unarchivePersonal);// Personal unarchive
router.delete('/:classId/leave', requireClassAccess, leaveClass);                 // Leave class

module.exports = router;