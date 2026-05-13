# Fix: "API is Not Defined" Reference Error

## Date: May 13, 2026
## Status: ✅ FIXED

---

## Issue Summary

**Error:** `ReferenceError: api is not defined`  
**Location:** `confirmDeleteActivity()` function in `Frontend/js/classes.js`  
**Trigger:** Clicking "Delete Permanently" button in the delete confirmation modal

---

## Root Cause

The `confirmDeleteActivity()` function was calling `api.activities.delete()`, but:

1. The `api` object doesn't exist in the codebase
2. The correct object is `activityAPI` (defined in `Frontend/js/api.js`)
3. The correct pattern used throughout `classes.js` is `handleAPICall(() => activityAPI.method())`

### Incorrect Code (BEFORE)
```javascript
const confirmDeleteActivity = async () => {
    // ... validation code ...
    
    try {
        showLoading();
        closeDeleteActivityModal();
        
        // ❌ WRONG: api object doesn't exist
        const data = await api.activities.delete(editPageActivityId);
        
        showToast('Activity deleted successfully', 'success');
        // ... rest of code ...
    }
}
```

---

## The Fix

### Correct Code (AFTER)
```javascript
const confirmDeleteActivity = async () => {
    if (!editPageActivityId) {
        showToast('No activity selected', 'error');
        closeDeleteActivityModal();
        return;
    }
    
    try {
        showLoading();
        closeDeleteActivityModal();
        
        // ✅ CORRECT: Use activityAPI with handleAPICall wrapper
        const data = await handleAPICall(
            () => activityAPI.delete(editPageActivityId),
            'Failed to delete activity'
        );
        
        if (data) {
            showToast('Activity deleted successfully', 'success');
            
            // Navigate back to class details
            if (editPageActivityData && editPageActivityData.class_id) {
                showClassDetails(editPageActivityData.class_id);
            } else if (editPageReturnPath) {
                window.location.hash = editPageReturnPath;
            } else {
                showClasses();
            }
            
            // Reset state
            editPageActivityId = null;
            editPageActivityData = null;
            editPageFilesToRemove = [];
            editPageReturnPath = null;
        }
        
    } catch (error) {
        console.error('Delete activity error:', error);
        showToast(error.message || 'Failed to delete activity', 'error');
    } finally {
        hideLoading();
    }
};
```

---

## Why This Pattern?

### API Structure in the Codebase

The application uses a modular API structure defined in `Frontend/js/api.js`:

```javascript
// Generic API request wrapper
const apiRequest = async (endpoint, options = {}) => {
    // Handles authentication, errors, token expiration, etc.
};

// Activity-specific API calls
const activityAPI = {
    create: (classId, activityData) => apiRequest(...),
    getClassActivities: (classId) => apiRequest(...),
    getDetails: (activityId) => apiRequest(...),
    update: (activityId, activityData) => apiRequest(...),
    delete: (activityId) => apiRequest(...),  // ← This is what we need
    submitWork: (activityId, content) => apiRequest(...),
    gradeSubmission: (submissionId, score, feedback) => apiRequest(...)
};
```

### Consistent Pattern in classes.js

All API calls in `classes.js` follow this pattern:

```javascript
const result = await handleAPICall(
    () => activityAPI.someMethod(params),
    'Error message if it fails'
);
```

**Examples from the codebase:**
```javascript
// Load classes
const data = await handleAPICall(
    () => classAPI.getUserClasses(),
    'Failed to load classes'
);

// Load activities
const data = await handleAPICall(
    () => activityAPI.getClassActivities(classId),
    'Failed to load activities'
);

// Delete class
const result = await handleAPICall(
    () => classAPI.delete(classId),
    'Failed to delete class'
);
```

---

## Benefits of Using handleAPICall

The `handleAPICall` wrapper provides:

1. **Consistent Error Handling:** Automatically shows error toasts
2. **Loading State Management:** Handles loading indicators
3. **Authentication Handling:** Manages token expiration and redirects
4. **Access Revocation:** Handles kicked/blocked user scenarios
5. **Null Safety:** Returns null on error instead of throwing

---

## Backend Cascade Deletion (Verified ✅)

### Database Schema
```sql
CREATE TABLE Submissions (
    submission_id INT PRIMARY KEY AUTO_INCREMENT,
    activity_id INT NOT NULL,
    user_id INT NOT NULL,
    content TEXT,
    file_path VARCHAR(500),
    score DECIMAL(5,2) DEFAULT NULL,
    feedback TEXT,
    submission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (activity_id) REFERENCES Activities(activity_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_submission (activity_id, user_id)
);
```

**Key Line:** `ON DELETE CASCADE` ensures that when an activity is deleted, all submissions are automatically deleted.

### Backend Controller (Already Implemented)

**File:** `Backend/Controllers/activityController.js`

The `deleteActivity` function handles:

1. **Ownership Verification:** Only room creator can delete
2. **File Cleanup:** Deletes activity attachment files from disk
3. **Submission File Cleanup:** Deletes all student submission files from disk
4. **Database Deletion:** Removes activity (submissions cascade automatically)

```javascript
const deleteActivity = async (req, res) => {
    try {
        const { activityId } = req.params;
        const userId = req.user.user_id;

        // Verify ownership
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

        // Only room creator can delete
        if (activity.room_creator !== userId) {
            return res.status(403).json({ error: 'Only the room creator can delete activities' });
        }

        // Get all submission files
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
                    fs.unlinkSync(filePath);
                }
            }
        }

        // Delete submission files
        for (const submission of submissions) {
            if (submission.file_path) {
                const filePath = path.join(__dirname, '../uploads/activities', submission.file_path);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }
        }

        // Delete activity (submissions cascade automatically)
        await pool.execute(
            'DELETE FROM Activities WHERE activity_id = ?',
            [activityId]
        );

        res.json({ 
            message: 'Activity deleted successfully',
            files_deleted: (activity.attachment_path ? activity.attachment_path.split(',').length : 0) + submissions.length
        });

    } catch (error) {
        console.error('Delete activity error:', error);
        res.status(500).json({ error: 'Server error deleting activity' });
    }
};
```

---

## Complete Deletion Flow

```
User clicks "Delete Permanently"
    ↓
confirmDeleteActivity() called
    ↓
Show loading indicator
    ↓
Close confirmation modal
    ↓
Call: handleAPICall(() => activityAPI.delete(activityId))
    ↓
API Request: DELETE /api/activities/:activityId
    ↓
Backend Controller: deleteActivity()
    ↓
1. Verify user is room creator (403 if not)
2. Get activity and submission file paths
3. Delete activity attachment files from disk
4. Delete submission files from disk
5. Delete activity from database
6. Submissions CASCADE delete automatically
    ↓
Success Response: { message: "Activity deleted successfully", files_deleted: 5 }
    ↓
Frontend receives response
    ↓
Show success toast: "Activity deleted successfully"
    ↓
Navigate to class details page
    ↓
Reset state variables
    ↓
Hide loading indicator
```

---

## User Feedback & Navigation

### Success Scenario
1. ✅ Loading indicator appears immediately
2. ✅ Modal closes
3. ✅ Success toast: "Activity deleted successfully"
4. ✅ Automatic redirect to class details page (Room Dashboard)
5. ✅ Activity no longer appears in list
6. ✅ Clean state reset

### Error Scenarios

#### 1. Not Room Creator (403)
- ❌ Error toast: "Only the room creator can delete activities"
- User remains on edit page
- Activity is NOT deleted

#### 2. Activity Not Found (404)
- ❌ Error toast: "Activity not found"
- User remains on edit page

#### 3. Network Error
- ❌ Error toast: "Failed to delete activity"
- User remains on edit page
- Can retry after fixing connection

#### 4. Server Error (500)
- ❌ Error toast: "Server error deleting activity"
- User remains on edit page
- Activity is NOT deleted

---

## Testing Checklist

### Basic Functionality
- [x] Fix applied to `confirmDeleteActivity()` function
- [ ] Delete button opens confirmation modal
- [ ] "Delete Permanently" button triggers deletion
- [ ] No "api is not defined" error
- [ ] Loading indicator appears
- [ ] Success toast appears
- [ ] Redirects to class details page
- [ ] Activity removed from list

### Database & Files
- [ ] Activity deleted from database
- [ ] Submissions deleted from database (CASCADE)
- [ ] Activity files deleted from disk
- [ ] Submission files deleted from disk
- [ ] No orphaned records
- [ ] No orphaned files

### Error Handling
- [ ] Non-owner gets 403 error
- [ ] Network error shows appropriate message
- [ ] Server error shows appropriate message
- [ ] User can retry after error

### Navigation
- [ ] Redirects to correct class details page
- [ ] State variables properly reset
- [ ] No crashes after deletion
- [ ] Browser back button works correctly

---

## Files Modified

1. **Frontend/js/classes.js**
   - Fixed `confirmDeleteActivity()` function
   - Changed from `api.activities.delete()` to `activityAPI.delete()`
   - Wrapped in `handleAPICall()` for consistency

---

## Related Files (No Changes Needed)

1. **Frontend/js/api.js** - Already has `activityAPI.delete()` defined
2. **Backend/Controllers/activityController.js** - Already has `deleteActivity()` implemented
3. **Database/schema.sql** - Already has CASCADE configured

---

## Comparison: Before vs After

### BEFORE (Broken)
```javascript
// ❌ Reference Error: api is not defined
const data = await api.activities.delete(editPageActivityId);
```

### AFTER (Fixed)
```javascript
// ✅ Uses correct API object and pattern
const data = await handleAPICall(
    () => activityAPI.delete(editPageActivityId),
    'Failed to delete activity'
);
```

---

## Why the Error Occurred

1. **Incorrect Object Name:** Used `api` instead of `activityAPI`
2. **Missing Wrapper:** Didn't use `handleAPICall()` wrapper
3. **Inconsistent Pattern:** Didn't follow the pattern used elsewhere in the file

---

## Prevention for Future Development

### When Adding New API Calls in classes.js:

1. ✅ **DO:** Use the appropriate API object (`classAPI`, `activityAPI`, `dashboardAPI`, etc.)
2. ✅ **DO:** Wrap calls in `handleAPICall()` for error handling
3. ✅ **DO:** Follow the existing pattern in the file
4. ❌ **DON'T:** Create new API object names
5. ❌ **DON'T:** Use direct `fetch()` calls (unless necessary)
6. ❌ **DON'T:** Skip the `handleAPICall()` wrapper

### Template for New API Calls:
```javascript
const myFunction = async (params) => {
    const result = await handleAPICall(
        () => appropriateAPI.methodName(params),
        'User-friendly error message'
    );
    
    if (result) {
        // Handle success
        showToast('Success message', 'success');
        // Update UI, navigate, etc.
    }
};
```

---

## Status: ✅ FIXED AND READY FOR TESTING

The "api is not defined" error has been fixed. The deletion functionality now:
- Uses the correct API object (`activityAPI`)
- Follows the consistent pattern used throughout the file
- Provides proper error handling
- Shows appropriate user feedback
- Navigates correctly after deletion
- Cleans up all related data and files

---

## Next Steps

1. Test the delete functionality in the browser
2. Verify no console errors appear
3. Confirm successful deletion and navigation
4. Verify database CASCADE works correctly
5. Confirm files are deleted from disk
