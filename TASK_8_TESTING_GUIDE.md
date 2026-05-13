# Task 8: Testing Guide - Room Features & Data Integrity

**Quick Reference for Testing the Three New Features**

---

## Prerequisites

1. **Database Migration:**
   ```bash
   mysql -u root -p student_tracker < Database/add_announcements.sql
   ```

2. **Server Restart:**
   ```bash
   cd Backend
   node server.js
   ```

3. **Test Accounts:**
   - Teacher account (room creator)
   - Student account (enrolled in class)

---

## Feature 1: Room Announcements

### Test as Teacher

1. **Navigate to Class:**
   - Login as teacher
   - Click on a class you created
   - Go to "Activities" tab

2. **Post Announcement:**
   - You should see a text area at the top: "Share something with your class..."
   - Type a message (e.g., "Welcome to the class!")
   - Click "Post" button
   - ✅ Announcement should appear below the form
   - ✅ Your name and timestamp should be visible
   - ✅ Delete button (trash icon) should be visible

3. **Post Multiple Announcements:**
   - Post 2-3 more announcements
   - ✅ Newest should appear at the top
   - ✅ All should have delete buttons

4. **Delete Announcement:**
   - Click trash icon on any announcement
   - Confirm deletion
   - ✅ Announcement should disappear immediately

5. **Test Validation:**
   - Try posting empty announcement
   - ✅ Should show error: "Please enter announcement content"
   - Try posting 5001+ character announcement
   - ✅ Should show error: "Announcement is too long"

### Test as Student

1. **Navigate to Class:**
   - Login as student
   - Click on the same class
   - Go to "Activities" tab

2. **View Announcements:**
   - ✅ Should see all announcements posted by teacher
   - ✅ Should NOT see post form
   - ✅ Should NOT see delete buttons
   - ✅ Can read all announcement content

3. **Empty State:**
   - If no announcements exist:
   - ✅ Section should be hidden completely

---

## Feature 2: Delete Activity

### Test as Teacher (Room Creator)

1. **Navigate to Activity:**
   - Login as teacher (room creator)
   - Go to a class you created
   - Click on any activity
   - Click "Edit" button

2. **Locate Delete Button:**
   - On Edit Activity page
   - ✅ Should see red "Delete Activity" button on the left side
   - ✅ Button should have trash icon

3. **Delete Activity:**
   - Click "Delete Activity" button
   - ✅ First confirmation dialog appears with warning
   - ✅ Dialog lists what will be deleted (submissions, grades, files)
   - Click "OK"
   - ✅ Second confirmation dialog appears
   - Click "OK"
   - ✅ Activity deleted successfully
   - ✅ Redirected to class details page
   - ✅ Activity no longer appears in list

4. **Verify Deletion:**
   - Check class activities list
   - ✅ Deleted activity should be gone
   - Check server uploads folder
   - ✅ Activity files should be deleted
   - ✅ Submission files should be deleted

5. **Test Cancellation:**
   - Try deleting another activity
   - Click "Cancel" on first dialog
   - ✅ Activity should NOT be deleted
   - Try again, click "OK" on first, "Cancel" on second
   - ✅ Activity should NOT be deleted

### Test as Student

1. **Verify No Access:**
   - Login as student
   - Try to access edit page directly (if possible)
   - ✅ Should not see delete button
   - ✅ Should not be able to delete via API

---

## Feature 3: Max Score Verification

### Test Create Activity

1. **Create with Default Max Score:**
   - Login as teacher
   - Click "Create Activity"
   - Fill in title and description
   - ✅ Max Score field should show "100" by default
   - Click "Create"
   - ✅ Activity created successfully

2. **Create with Custom Max Score:**
   - Click "Create Activity" again
   - Fill in title and description
   - Change Max Score to "50"
   - Click "Create"
   - ✅ Activity created successfully
   - View activity details
   - ✅ Max score should be 50 (not 100)

3. **Create with Large Max Score:**
   - Create another activity
   - Set Max Score to "200"
   - ✅ Should work correctly

### Test Edit Activity

1. **Edit Max Score:**
   - Open any activity
   - Click "Edit"
   - ✅ Max Score field should show current value
   - Change Max Score to a different value (e.g., 75)
   - Click "Save Changes"
   - ✅ Changes saved successfully

2. **Verify Persistence:**
   - Refresh the page
   - Open the same activity
   - Click "Edit"
   - ✅ Max Score should still be 75 (not reverted to 100)

3. **Edit Without Changing Max Score:**
   - Edit activity
   - Change only the title
   - Don't touch Max Score field
   - Save changes
   - ✅ Max Score should remain unchanged

### Test Inline Grading

1. **Grade with Custom Max Score:**
   - Create activity with max_score = 50
   - Have student submit work
   - As teacher, view submissions
   - ✅ Score input should show "/ 50" (not "/ 100")
   - Enter score: 45
   - Save grade
   - ✅ Should accept score
   - Try entering score: 55
   - ✅ Should reject (exceeds max_score)

2. **Grade with Default Max Score:**
   - Create activity with default max_score (100)
   - Have student submit work
   - As teacher, view submissions
   - ✅ Score input should show "/ 100"
   - Enter score: 95
   - Save grade
   - ✅ Should accept score

---

## Integration Tests

### Test 1: Complete Workflow

1. Teacher creates class
2. Teacher posts announcement: "Welcome!"
3. Student joins class
4. Student sees announcement
5. Teacher creates activity (max_score = 50)
6. Student submits work
7. Teacher grades submission (45/50)
8. Teacher posts announcement: "Great work!"
9. Teacher edits activity (changes max_score to 60)
10. Teacher deletes old activity
11. ✅ All features work together seamlessly

### Test 2: Multiple Classes

1. Teacher creates 2 classes
2. Posts announcements in both
3. ✅ Announcements don't mix between classes
4. Deletes activity in Class A
5. ✅ Class B activities unaffected

### Test 3: Multiple Teachers

1. Teacher A creates class
2. Teacher B joins as co-teacher
3. Teacher A posts announcement
4. ✅ Teacher B can see and delete announcement
5. Teacher A creates activity
6. ✅ Only Teacher A (room creator) can delete activity

---

## Error Scenarios

### Announcements

| Scenario | Expected Result |
|----------|----------------|
| Post empty announcement | Error: "Please enter announcement content" |
| Post 5001+ characters | Error: "Announcement is too long" |
| Delete non-existent announcement | Error: "Announcement not found" |
| Student tries to post | No post form visible |
| Student tries to delete | No delete buttons visible |

### Delete Activity

| Scenario | Expected Result |
|----------|----------------|
| Non-creator tries to delete | Error: "Only the room creator can delete activities" |
| Delete non-existent activity | Error: "Activity not found" |
| Cancel first confirmation | Activity not deleted |
| Cancel second confirmation | Activity not deleted |

### Max Score

| Scenario | Expected Result |
|----------|----------------|
| Set max_score to 0 | Error: "Max score must be greater than 0" |
| Set max_score to negative | Error: "Max score must be greater than 0" |
| Grade above max_score | Error: "Score must be between 0 and [max_score]" |

---

## Performance Tests

### Announcements

1. **Load Time:**
   - Post 50 announcements
   - Refresh page
   - ✅ Should load in < 2 seconds

2. **Scroll Performance:**
   - With 50 announcements
   - Scroll through feed
   - ✅ Should be smooth (no lag)

### Delete Activity

1. **Large Activity:**
   - Create activity with 10 files
   - Have 20 students submit with files
   - Delete activity
   - ✅ Should complete in < 5 seconds
   - ✅ All files should be deleted

---

## Browser Compatibility

Test in:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

For each browser:
- [ ] Announcements work
- [ ] Delete activity works
- [ ] Max score persists
- [ ] No console errors

---

## Mobile Testing

Test on mobile devices:
- [ ] Announcements readable
- [ ] Post form usable
- [ ] Delete confirmations work
- [ ] Edit activity page responsive
- [ ] Delete button accessible

---

## Regression Tests

Verify existing features still work:

- [ ] Create class
- [ ] Join class
- [ ] Create activity (without announcements)
- [ ] Submit work
- [ ] Grade submission
- [ ] Edit activity (without deleting)
- [ ] View reports
- [ ] Notifications work

---

## Bug Report Template

If you find issues, report using this format:

```
**Feature:** [Announcements / Delete Activity / Max Score]
**Issue:** [Brief description]
**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Result:** [What should happen]
**Actual Result:** [What actually happened]
**Browser:** [Chrome/Firefox/Safari/Edge]
**User Role:** [Teacher/Student]
**Screenshots:** [If applicable]
**Console Errors:** [If any]
```

---

## Success Criteria

All features pass when:

✅ **Announcements:**
- Teachers can post and delete
- Students can view only
- No XSS vulnerabilities
- Performance acceptable

✅ **Delete Activity:**
- Only room creator can delete
- Double confirmation works
- All files cleaned up
- Cascading delete works

✅ **Max Score:**
- Persists on create
- Persists on edit
- Used in grading validation
- Displays correctly

---

## Quick Smoke Test (5 minutes)

1. ✅ Post announcement as teacher
2. ✅ View announcement as student
3. ✅ Delete announcement as teacher
4. ✅ Create activity with max_score = 50
5. ✅ Edit activity, verify max_score = 50
6. ✅ Delete activity with confirmation
7. ✅ Verify activity deleted

If all pass → Ready for production! 🚀

---

**Last Updated:** May 13, 2026
