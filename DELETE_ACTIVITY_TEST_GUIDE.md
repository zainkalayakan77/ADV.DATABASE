# Delete Activity - Quick Test Guide

## Pre-Test Setup

1. **Create Test Data:**
   - Create a class as a teacher
   - Create an activity with attachments
   - Have at least one student submit work

2. **Open Browser Console:**
   - Press F12 (Chrome/Edge/Firefox)
   - Go to Console tab
   - Keep it open during testing

---

## Test 1: Successful Deletion (Happy Path)

### Steps:
1. Navigate to a class you created
2. Click on an activity
3. Click "Edit" button
4. Click "Delete Activity" button (red, bottom-left)
5. Verify confirmation modal appears
6. Click "Delete Permanently" button

### Expected Results:
- ✅ No console errors (especially no "api is not defined")
- ✅ Loading indicator appears briefly
- ✅ Modal closes
- ✅ Success toast: "Activity deleted successfully"
- ✅ Redirected to class details page (Room Dashboard)
- ✅ Activity no longer in the list

### If This Fails:
- Check console for errors
- Verify you're the room creator
- Check network tab for API response

---

## Test 2: Console Error Check

### Steps:
1. Open browser console (F12)
2. Clear console (trash icon or Ctrl+L)
3. Perform Test 1 steps
4. Watch console during deletion

### Expected Results:
- ✅ No "api is not defined" error
- ✅ No "activityAPI is not defined" error
- ✅ No "handleAPICall is not defined" error
- ✅ Only normal API request logs

### If You See Errors:
- "api is not defined" → Fix not applied correctly
- "activityAPI is not defined" → api.js not loaded
- "handleAPICall is not defined" → Missing utility function

---

## Test 3: Database Verification

### Before Deletion:
```sql
-- Note the activity_id
SELECT activity_id, title FROM Activities WHERE activity_id = [YOUR_ACTIVITY_ID];

-- Note submission count
SELECT COUNT(*) FROM Submissions WHERE activity_id = [YOUR_ACTIVITY_ID];
```

### After Deletion:
```sql
-- Should return 0 rows
SELECT * FROM Activities WHERE activity_id = [YOUR_ACTIVITY_ID];

-- Should return 0 rows (CASCADE deletion)
SELECT * FROM Submissions WHERE activity_id = [YOUR_ACTIVITY_ID];
```

### Expected Results:
- ✅ Activity deleted from database
- ✅ All submissions deleted (CASCADE)
- ✅ No orphaned records

---

## Test 4: File System Verification

### Before Deletion:
1. Note the activity attachment filenames
2. Note submission filenames
3. Check `Backend/uploads/activities/` folder

### After Deletion:
1. Check `Backend/uploads/activities/` folder
2. Verify files are deleted

### Expected Results:
- ✅ Activity attachment files deleted
- ✅ Submission files deleted
- ✅ No orphaned files

---

## Test 5: Permission Check (Non-Owner)

### Steps:
1. Create a class as User A
2. Create an activity
3. Log out and log in as User B
4. Join the class as User B
5. Try to access Edit Activity page (if possible)
6. Try to delete the activity

### Expected Results:
- ✅ User B cannot delete the activity
- ✅ API returns 403 Forbidden
- ✅ Error toast: "Only the room creator can delete activities"
- ✅ Activity is NOT deleted

---

## Test 6: Network Error Handling

### Steps:
1. Open browser DevTools (F12)
2. Go to Network tab
3. Enable "Offline" mode
4. Try to delete an activity

### Expected Results:
- ✅ Error toast appears
- ✅ Message indicates network issue
- ✅ User remains on Edit Activity page
- ✅ Activity is NOT deleted
- ✅ Can retry after going back online

---

## Test 7: Cancel Deletion

### Steps:
1. Click "Delete Activity" button
2. Confirmation modal appears
3. Click "Cancel" button (or X, or overlay)

### Expected Results:
- ✅ Modal closes
- ✅ Activity is NOT deleted
- ✅ User remains on Edit Activity page
- ✅ No API calls made

---

## Test 8: Multiple Deletions

### Steps:
1. Create 3 activities
2. Delete first activity
3. Verify success
4. Delete second activity
5. Verify success
6. Delete third activity
7. Verify success

### Expected Results:
- ✅ All deletions succeed
- ✅ No errors accumulate
- ✅ State properly reset between deletions
- ✅ Navigation works for each deletion

---

## Quick Verification Checklist

After running tests, verify:

- [ ] No "api is not defined" error in console
- [ ] Delete button works without crashes
- [ ] Success toast appears
- [ ] Redirects to class details page
- [ ] Activity removed from list
- [ ] Activity deleted from database
- [ ] Submissions deleted from database
- [ ] Files deleted from disk
- [ ] Non-owner cannot delete (403)
- [ ] Network errors handled gracefully

---

## Common Issues and Solutions

### Issue: "api is not defined"
**Cause:** Fix not applied  
**Solution:** Verify `confirmDeleteActivity()` uses `activityAPI.delete()`

### Issue: "activityAPI is not defined"
**Cause:** api.js not loaded  
**Solution:** Check that api.js is included in index.html before classes.js

### Issue: "handleAPICall is not defined"
**Cause:** Utility function missing  
**Solution:** Verify handleAPICall is defined in api.js or app.js

### Issue: 403 Forbidden Error
**Cause:** User is not room creator  
**Solution:** This is correct behavior - only room creator can delete

### Issue: Files Not Deleted
**Cause:** File path mismatch or permissions  
**Solution:** Check backend console logs for file deletion errors

### Issue: Submissions Not Deleted
**Cause:** CASCADE not configured  
**Solution:** Verify database schema has ON DELETE CASCADE

---

## Success Criteria

All of the following must be true:

✅ No console errors during deletion  
✅ Success toast appears  
✅ Redirects to class details  
✅ Activity removed from UI  
✅ Activity deleted from database  
✅ Submissions deleted from database  
✅ Files deleted from disk  
✅ Non-owner gets 403 error  
✅ Network errors handled gracefully  
✅ Can delete multiple activities  

---

## If All Tests Pass

The fix is successful! The "api is not defined" error is resolved and deletion functionality works correctly.

## If Tests Fail

1. Check browser console for specific errors
2. Verify the fix was applied to `Frontend/js/classes.js`
3. Check that `activityAPI.delete()` is defined in `Frontend/js/api.js`
4. Verify `handleAPICall()` function exists
5. Check backend logs for server-side errors
6. Verify database CASCADE is configured

---

## Quick Command Reference

### Check Function Implementation:
```bash
grep -A 20 "const confirmDeleteActivity" Frontend/js/classes.js
```

### Check API Definition:
```bash
grep -A 5 "delete: (activityId)" Frontend/js/api.js
```

### Check Database CASCADE:
```bash
grep "ON DELETE CASCADE" Database/schema.sql
```

### View Backend Logs:
```bash
# In backend directory
npm run dev
# Watch for deletion logs
```

---

## Test Report Template

```
Date: ___________
Tester: ___________
Browser: ___________

TEST RESULTS:
[ ] Test 1: Successful Deletion - PASS / FAIL
[ ] Test 2: Console Error Check - PASS / FAIL
[ ] Test 3: Database Verification - PASS / FAIL
[ ] Test 4: File System Verification - PASS / FAIL
[ ] Test 5: Permission Check - PASS / FAIL
[ ] Test 6: Network Error Handling - PASS / FAIL
[ ] Test 7: Cancel Deletion - PASS / FAIL
[ ] Test 8: Multiple Deletions - PASS / FAIL

CONSOLE ERRORS:
_________________________________

NOTES:
_________________________________
_________________________________
```
