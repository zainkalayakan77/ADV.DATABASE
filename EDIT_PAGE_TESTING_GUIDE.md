# Edit Activity Page - Testing Guide

## Overview
This guide covers testing for the navigation and deletion fixes implemented in the Edit Activity page.

---

## Test Environment Setup

### Prerequisites
1. At least one class created
2. At least one activity in that class
3. At least one student submission (for cascade deletion testing)
4. Test as the room creator (teacher role)

### Test Data Preparation
```sql
-- Verify you have test data
SELECT a.activity_id, a.title, 
       COUNT(s.submission_id) as submission_count
FROM Activities a
LEFT JOIN Submissions s ON a.activity_id = s.activity_id
GROUP BY a.activity_id;
```

---

## Part 1: Navigation Tests

### Test 1.1: Back Button (Header)
**Steps:**
1. Navigate to a class details page
2. Click on an activity to view details
3. Click "Edit" button to open Edit Activity page
4. Click the "Back" button in the page header (top-left)

**Expected Result:**
- ✅ Page navigates back to activity details immediately
- ✅ No form submission attempt
- ✅ No error messages
- ✅ No loading indicator
- ✅ No API calls in Network tab

**Failure Indicators:**
- ❌ "Unexpected Error" message
- ❌ Form validation errors
- ❌ Page hangs or freezes
- ❌ API calls to update activity

---

### Test 1.2: Cancel Button (Footer)
**Steps:**
1. Navigate to Edit Activity page
2. Make some changes to the form (change title, description, etc.)
3. Click the "Cancel" button in the footer (bottom-left)

**Expected Result:**
- ✅ Page navigates back to activity details immediately
- ✅ Changes are NOT saved
- ✅ No form submission attempt
- ✅ No error messages
- ✅ No confirmation dialog (changes are discarded)

**Failure Indicators:**
- ❌ "Unexpected Error" message
- ❌ Changes are saved
- ❌ Form validation errors

---

### Test 1.3: Navigation Without Changes
**Steps:**
1. Navigate to Edit Activity page
2. Don't make any changes
3. Click "Back" or "Cancel"

**Expected Result:**
- ✅ Instant navigation
- ✅ No "No changes detected" message
- ✅ Clean return to previous page

---

### Test 1.4: Navigation After Validation Error
**Steps:**
1. Navigate to Edit Activity page
2. Clear the "Activity Title" field (make it empty)
3. Try to click "Save Changes" (should show validation error)
4. Click "Back" or "Cancel"

**Expected Result:**
- ✅ Navigation works despite validation error
- ✅ No form submission attempt
- ✅ Clean exit from edit page

---

## Part 2: Deletion Tests

### Test 2.1: Delete Button Visibility
**Steps:**
1. Navigate to Edit Activity page

**Expected Result:**
- ✅ "Delete Activity" button is visible
- ✅ Button is red (error color)
- ✅ Button is on the left side of footer
- ✅ Button has trash icon

---

### Test 2.2: Delete Confirmation Modal
**Steps:**
1. Navigate to Edit Activity page
2. Click "Delete Activity" button

**Expected Result:**
- ✅ Confirmation modal appears
- ✅ Modal has warning icon (triangle)
- ✅ Modal title says "Delete Activity"
- ✅ Warning message is clear and visible
- ✅ Lists what will be deleted:
  - The activity and all its attachments
  - All student submissions and their files
  - All grades and feedback
- ✅ Shows "This action cannot be undone!" in red
- ✅ Two buttons visible: "Cancel" and "Delete Permanently"

**Failure Indicators:**
- ❌ Modal doesn't appear
- ❌ "Unexpected Error" message
- ❌ Form submission attempt

---

### Test 2.3: Cancel Deletion (Button)
**Steps:**
1. Open delete confirmation modal
2. Click "Cancel" button in modal

**Expected Result:**
- ✅ Modal closes
- ✅ Activity is NOT deleted
- ✅ User remains on Edit Activity page
- ✅ No API calls made

---

### Test 2.4: Cancel Deletion (Overlay Click)
**Steps:**
1. Open delete confirmation modal
2. Click on the dark overlay (outside the modal)

**Expected Result:**
- ✅ Modal closes
- ✅ Activity is NOT deleted
- ✅ User remains on Edit Activity page

---

### Test 2.5: Cancel Deletion (X Button)
**Steps:**
1. Open delete confirmation modal
2. Click the "×" button in modal header

**Expected Result:**
- ✅ Modal closes
- ✅ Activity is NOT deleted
- ✅ User remains on Edit Activity page

---

### Test 2.6: Successful Deletion (No Submissions)
**Steps:**
1. Create a new activity with no student submissions
2. Navigate to Edit Activity page for this activity
3. Click "Delete Activity"
4. Click "Delete Permanently" in confirmation modal

**Expected Result:**
- ✅ Loading indicator appears
- ✅ Modal closes immediately
- ✅ Success message: "Activity deleted successfully"
- ✅ User navigated back to class details page
- ✅ Activity no longer appears in activity list
- ✅ Activity files deleted from server

**Database Verification:**
```sql
-- Activity should be gone
SELECT * FROM Activities WHERE activity_id = [deleted_id];
-- Should return 0 rows
```

---

### Test 2.7: Successful Deletion (With Submissions)
**Steps:**
1. Use an activity that has student submissions
2. Note the number of submissions
3. Navigate to Edit Activity page
4. Click "Delete Activity"
5. Click "Delete Permanently"

**Expected Result:**
- ✅ Loading indicator appears
- ✅ Success message appears
- ✅ User navigated back to class details
- ✅ Activity no longer appears in list
- ✅ All submissions deleted from database
- ✅ All submission files deleted from server

**Database Verification:**
```sql
-- Activity should be gone
SELECT * FROM Activities WHERE activity_id = [deleted_id];
-- Should return 0 rows

-- Submissions should be gone (CASCADE)
SELECT * FROM Submissions WHERE activity_id = [deleted_id];
-- Should return 0 rows
```

**File System Verification:**
- Check `Backend/uploads/activities/` folder
- Submission files should be deleted
- Activity attachment files should be deleted

---

### Test 2.8: Deletion Permission Check (Non-Owner)
**Steps:**
1. Create a class as User A (teacher)
2. Create an activity in that class
3. Log out and log in as User B
4. Have User B join the class as a student
5. Try to access the Edit Activity page directly (if possible)

**Expected Result:**
- ✅ User B cannot access Edit Activity page, OR
- ✅ If accessed, Delete button should not work
- ✅ API returns 403 Forbidden error
- ✅ Error message: "Only the room creator can delete activities"

**Note:** This test verifies backend security, not just frontend hiding.

---

### Test 2.9: Deletion with Large Files
**Steps:**
1. Create an activity with multiple large attachments (images, PDFs)
2. Have students submit work with large files
3. Delete the activity

**Expected Result:**
- ✅ Deletion completes successfully
- ✅ All files removed from disk
- ✅ No "file not found" errors
- ✅ Success message appears

---

### Test 2.10: Rapid Button Clicks (Double-Click Prevention)
**Steps:**
1. Open delete confirmation modal
2. Rapidly click "Delete Permanently" multiple times

**Expected Result:**
- ✅ Only one deletion request is sent
- ✅ Loading indicator prevents multiple clicks
- ✅ No duplicate deletion attempts
- ✅ No errors from trying to delete already-deleted activity

---

## Part 3: Integration Tests

### Test 3.1: Delete Then Navigate
**Steps:**
1. Delete an activity successfully
2. Use browser back button
3. Try to navigate to the deleted activity

**Expected Result:**
- ✅ Activity not found error, OR
- ✅ Redirected to class details
- ✅ No crash or unexpected behavior

---

### Test 3.2: Edit and Delete Workflow
**Steps:**
1. Edit an activity (change title)
2. Save changes
3. Immediately delete the activity

**Expected Result:**
- ✅ Both operations succeed
- ✅ No conflicts or errors
- ✅ Activity deleted with updated data

---

### Test 3.3: Multiple Modals
**Steps:**
1. Open Edit Activity page
2. Click "Delete Activity" (confirmation modal opens)
3. Click "Cancel"
4. Click "Add New Files" (if it opens a file picker)
5. Click "Delete Activity" again

**Expected Result:**
- ✅ Modals don't interfere with each other
- ✅ Delete confirmation modal works correctly
- ✅ No modal stacking issues

---

### Test 3.4: File Viewer and Delete
**Steps:**
1. Open Edit Activity page
2. Click "View" on an attachment (file viewer modal opens)
3. Close file viewer
4. Click "Delete Activity"

**Expected Result:**
- ✅ Delete confirmation modal opens correctly
- ✅ No modal conflicts
- ✅ Both modals work independently

---

## Part 4: Error Handling Tests

### Test 4.1: Network Error During Deletion
**Steps:**
1. Open browser DevTools
2. Go to Network tab
3. Enable "Offline" mode
4. Try to delete an activity

**Expected Result:**
- ✅ Error message appears
- ✅ Message indicates network/connection issue
- ✅ User remains on Edit Activity page
- ✅ Activity is NOT deleted
- ✅ Can retry after going back online

---

### Test 4.2: Server Error During Deletion
**Steps:**
1. Temporarily modify backend to return 500 error
2. Try to delete an activity

**Expected Result:**
- ✅ Error message appears
- ✅ Message: "Failed to delete activity" or similar
- ✅ User remains on Edit Activity page
- ✅ Activity is NOT deleted

---

### Test 4.3: Unauthorized Deletion Attempt
**Steps:**
1. Open Edit Activity page
2. Open browser console
3. Clear localStorage (removes auth token)
4. Try to delete activity

**Expected Result:**
- ✅ Error message appears
- ✅ User redirected to login, OR
- ✅ "Unauthorized" error shown
- ✅ Activity is NOT deleted

---

## Part 5: Browser Compatibility Tests

### Test 5.1: Chrome/Edge
- [ ] All navigation tests pass
- [ ] All deletion tests pass
- [ ] Modals display correctly
- [ ] Buttons work as expected

### Test 5.2: Firefox
- [ ] All navigation tests pass
- [ ] All deletion tests pass
- [ ] Modals display correctly
- [ ] Buttons work as expected

### Test 5.3: Safari
- [ ] All navigation tests pass
- [ ] All deletion tests pass
- [ ] Modals display correctly
- [ ] Buttons work as expected

---

## Part 6: Mobile/Responsive Tests

### Test 6.1: Mobile View (< 768px)
**Steps:**
1. Resize browser to mobile width
2. Navigate to Edit Activity page
3. Test all buttons

**Expected Result:**
- ✅ All buttons visible and clickable
- ✅ Delete confirmation modal fits screen
- ✅ Text is readable
- ✅ No horizontal scrolling required

---

## Test Results Template

```
Date: ___________
Tester: ___________
Browser: ___________
Device: ___________

NAVIGATION TESTS:
[ ] Test 1.1: Back Button - PASS / FAIL
[ ] Test 1.2: Cancel Button - PASS / FAIL
[ ] Test 1.3: Navigation Without Changes - PASS / FAIL
[ ] Test 1.4: Navigation After Validation Error - PASS / FAIL

DELETION TESTS:
[ ] Test 2.1: Delete Button Visibility - PASS / FAIL
[ ] Test 2.2: Delete Confirmation Modal - PASS / FAIL
[ ] Test 2.3: Cancel Deletion (Button) - PASS / FAIL
[ ] Test 2.4: Cancel Deletion (Overlay) - PASS / FAIL
[ ] Test 2.5: Cancel Deletion (X Button) - PASS / FAIL
[ ] Test 2.6: Successful Deletion (No Submissions) - PASS / FAIL
[ ] Test 2.7: Successful Deletion (With Submissions) - PASS / FAIL
[ ] Test 2.8: Deletion Permission Check - PASS / FAIL
[ ] Test 2.9: Deletion with Large Files - PASS / FAIL
[ ] Test 2.10: Rapid Button Clicks - PASS / FAIL

INTEGRATION TESTS:
[ ] Test 3.1: Delete Then Navigate - PASS / FAIL
[ ] Test 3.2: Edit and Delete Workflow - PASS / FAIL
[ ] Test 3.3: Multiple Modals - PASS / FAIL
[ ] Test 3.4: File Viewer and Delete - PASS / FAIL

ERROR HANDLING TESTS:
[ ] Test 4.1: Network Error - PASS / FAIL
[ ] Test 4.2: Server Error - PASS / FAIL
[ ] Test 4.3: Unauthorized Attempt - PASS / FAIL

NOTES:
_________________________________
_________________________________
_________________________________
```

---

## Common Issues and Solutions

### Issue: "Unexpected Error" on Delete
**Possible Causes:**
- Backend not running
- Database connection issue
- Foreign key constraint violation (should be fixed with CASCADE)

**Solution:**
- Check backend console logs
- Verify database schema has CASCADE
- Check network tab for actual error response

### Issue: Modal Doesn't Appear
**Possible Causes:**
- JavaScript error preventing modal display
- CSS display property conflict
- Modal overlay not configured

**Solution:**
- Check browser console for errors
- Verify modal HTML exists in index.html
- Check CSS for `.modal` and `.modal-overlay` styles

### Issue: Files Not Deleted
**Possible Causes:**
- File path mismatch
- Permission issues on server
- Files already deleted

**Solution:**
- Check backend console logs
- Verify file paths in database match actual files
- Check server file system permissions

---

## Success Criteria

All tests must pass for the feature to be considered complete:

✅ **Navigation:**
- Back and Cancel buttons work without form submission
- No crashes or unexpected errors
- Instant navigation without API calls

✅ **Deletion:**
- Confirmation modal appears and works correctly
- Deletion removes activity, submissions, and files
- Only room creator can delete
- Proper error handling for all edge cases

✅ **User Experience:**
- Clear warnings and confirmations
- Appropriate feedback messages
- Smooth navigation flow
- No data loss or corruption
