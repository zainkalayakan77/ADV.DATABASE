# Toggle & Attachment Fixes - Testing Guide
## Quick Verification Steps

**Time Required**: 10 minutes  
**Prerequisites**: Database migration completed (fix_500_error.sql)

---

## Test 1: Toggle Persistence (2 minutes)

### Steps:
1. ✅ Login as teacher
2. ✅ Open any activity
3. ✅ Click "Edit"
4. ✅ **Turn toggle OFF** (should show gray)
5. ✅ Click "Save Changes"
6. ✅ Wait for success message
7. ✅ Refresh page (F5)
8. ✅ Click "Edit" again

### Expected Result:
- ✅ Toggle should still be **OFF** (gray)
- ✅ No "rubber-banding" back to ON

### If It Fails:
- Check browser console for errors
- Verify database has `is_accepting_submissions` column
- Check server logs for errors

---

## Test 2: File Removal (3 minutes)

### Setup:
1. ✅ Create activity with 2-3 file attachments

### Steps:
1. ✅ Login as teacher
2. ✅ Open the activity
3. ✅ Click "Edit"
4. ✅ Verify files are listed with "Remove" buttons
5. ✅ Click "Remove" on one file
6. ✅ Verify file shows "Marked for removal" (grayed out)
7. ✅ Click "Save Changes"
8. ✅ Wait for success message (should say "1 file(s) removed")
9. ✅ Refresh page
10. ✅ Click "Edit" again

### Expected Result:
- ✅ Removed file should be **gone** from list
- ✅ Other files should still be there
- ✅ Success message shows removal count

### Verify on Server:
```bash
# Check if file was deleted from disk
ls Backend/uploads/activities/
# The removed file should not be in the list
```

---

## Test 3: Toggle-Only Update (2 minutes)

### Steps:
1. ✅ Login as teacher
2. ✅ Open any activity
3. ✅ Click "Edit"
4. ✅ **Only change the toggle** (don't change title, description, or files)
5. ✅ Click "Save Changes"

### Expected Result:
- ✅ Success message appears
- ✅ **No error** about missing files
- ✅ Toggle state is saved
- ✅ Students receive notification (if toggle changed state)

### If It Fails:
- Check if "No changes detected" appears (means toggle didn't register as change)
- Check browser console for errors
- Verify FormData is sending `is_accepting_submissions`

---

## Test 4: Remove All Files (2 minutes)

### Setup:
1. ✅ Activity with 2-3 attachments

### Steps:
1. ✅ Login as teacher
2. ✅ Open activity
3. ✅ Click "Edit"
4. ✅ Click "Remove" on **ALL files**
5. ✅ Click "Save Changes"

### Expected Result:
- ✅ Success message shows correct removal count
- ✅ "Current Attachments" section shows "No attachments yet"
- ✅ No errors
- ✅ Database `attachment_path` is NULL

### Verify in Database:
```sql
SELECT activity_id, title, attachment_path 
FROM Activities 
WHERE activity_id = [YOUR_ACTIVITY_ID];
-- attachment_path should be NULL
```

---

## Test 5: Remove + Add Files (2 minutes)

### Setup:
1. ✅ Activity with 2 attachments

### Steps:
1. ✅ Login as teacher
2. ✅ Open activity
3. ✅ Click "Edit"
4. ✅ Click "Remove" on 1 file
5. ✅ Click "Choose Files" and select 1 new file
6. ✅ Click "Save Changes"

### Expected Result:
- ✅ Success message: "Activity updated successfully! (1 file(s) added) (1 file(s) removed)"
- ✅ Removed file is gone
- ✅ New file appears in list
- ✅ Original file (not removed) is still there

---

## Test 6: Student View (1 minute)

### Setup:
1. ✅ Activity with toggle OFF

### Steps:
1. ✅ Login as student
2. ✅ Open the activity

### Expected Result:
- ✅ See message: "Submissions for this activity are currently closed by the teacher."
- ✅ **No** "Turn In" button
- ✅ **No** submission form
- ✅ Can still view instructions
- ✅ Can still download files

### Then:
1. ✅ Login as teacher
2. ✅ Turn toggle ON
3. ✅ Save
4. ✅ Login as student again
5. ✅ Refresh page

### Expected Result:
- ✅ Submission form now visible
- ✅ "Turn In" button present
- ✅ Can submit work

---

## Test 7: Notification on Toggle Change (1 minute)

### Steps:
1. ✅ Login as teacher
2. ✅ Open activity
3. ✅ Click "Edit"
4. ✅ Change toggle state (ON → OFF or OFF → ON)
5. ✅ Click "Save Changes"

### Expected Result:
- ✅ Success message: "Activity updated successfully!"
- ✅ Second message: "Students have been notified of the changes"
- ✅ Students receive in-app notification
- ✅ Students receive email notification

### Verify as Student:
1. ✅ Login as student
2. ✅ Check notification bell icon
3. ✅ Should see notification about submissions opening/closing

---

## Quick Verification Checklist

After running all tests, verify:

- [ ] Toggle OFF stays OFF after refresh
- [ ] Toggle ON stays ON after refresh
- [ ] Can remove individual files
- [ ] Can remove all files
- [ ] Can add files after removing
- [ ] Can change toggle without uploading files
- [ ] Removed files deleted from disk
- [ ] Removed files deleted from database
- [ ] Students see correct submission state
- [ ] Notifications sent on toggle change
- [ ] No console errors
- [ ] No server errors

---

## Common Issues & Solutions

### Issue: Toggle still rubber-bands

**Cause**: Database column missing or wrong type  
**Solution**: Run `Database/fix_500_error.sql`

### Issue: Remove button doesn't appear

**Cause**: Frontend code not updated  
**Solution**: Clear browser cache (Ctrl+Shift+Delete), refresh

### Issue: Files not actually deleted

**Cause**: Backend code not updated or file permissions  
**Solution**: 
- Verify backend code updated
- Check file permissions: `chmod 755 Backend/uploads/activities/`

### Issue: "No changes detected" when changing toggle

**Cause**: Boolean comparison issue  
**Solution**: Verify frontend code has proper boolean conversion

### Issue: Can't save without uploading file

**Cause**: Change detection not including toggle  
**Solution**: Verify `hasChanges` includes toggle comparison

---

## Browser Console Commands

### Check Toggle Value:
```javascript
// In edit modal
document.getElementById('edit-activity-accepting-submissions').checked
// Should return true or false
```

### Check FormData:
```javascript
// Add breakpoint in handleEditActivity
// Inspect formData
for (let pair of formData.entries()) {
    console.log(pair[0] + ': ' + pair[1]);
}
// Should show is_accepting_submissions: true or false
```

### Check Files to Remove:
```javascript
// In console
filesToRemove
// Should show array of filenames marked for removal
```

---

## Database Verification

### Check Toggle Value:
```sql
SELECT activity_id, title, is_accepting_submissions 
FROM Activities 
WHERE activity_id = [YOUR_ACTIVITY_ID];
-- Should show 0 (false) or 1 (true)
```

### Check Attachments:
```sql
SELECT activity_id, title, attachment_path 
FROM Activities 
WHERE activity_id = [YOUR_ACTIVITY_ID];
-- Should show comma-separated filenames or NULL
```

### Check All Activities:
```sql
SELECT activity_id, title, is_accepting_submissions, 
       LENGTH(attachment_path) as attachment_length
FROM Activities;
-- Verify toggle values are 0 or 1
-- Verify attachment_path lengths make sense
```

---

## Success Criteria

### ✅ All Tests Pass

- Toggle persists correctly
- Files can be removed
- Toggle can be changed alone
- Notifications work
- No errors in console
- No errors in server logs

### ✅ User Experience

- Teachers can control submissions reliably
- Teachers can manage attachments easily
- Students see correct submission state
- System behaves predictably

---

## Rollback Plan (If Needed)

If issues occur, you can rollback:

### Backend:
```bash
git checkout HEAD~1 Backend/Controllers/activityController.js
```

### Frontend:
```bash
git checkout HEAD~1 Frontend/js/classes.js
```

### Database:
```sql
-- Toggle column will remain (safe to keep)
-- Files won't be deleted (safe)
-- No rollback needed for database
```

---

**Testing Time**: 10 minutes  
**Difficulty**: Easy  
**Risk**: Low (changes are additive, not destructive)

