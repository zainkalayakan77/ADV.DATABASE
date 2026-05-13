# Testing Guide: Role-Based UI & Submission Flexibility

## 🧪 Quick Testing Checklist

### Test 1: Student Sees Tabs ✅

**Steps**:
1. Login as a student account
2. Navigate to any class you're enrolled in
3. Click on the "Activities" tab

**Expected Result**:
- ✅ See 4 tabs: All, Assigned, Submitted, Missing
- ✅ Each tab shows a count badge
- ✅ Tabs are clickable and filter activities
- ✅ Activities categorize correctly

**Pass Criteria**: All 4 tabs visible with correct counts

---

### Test 2: Teacher Doesn't See Tabs ✅

**Steps**:
1. Login as a teacher account
2. Navigate to a class you created
3. Click on the "Activities" tab

**Expected Result**:
- ✅ NO tabs visible
- ✅ See unified list of all activities
- ✅ See "Create Activity" button
- ✅ All activities visible at once

**Pass Criteria**: No tabs, unified list shows

---

### Test 3: Mark as Done Button ✅

**Steps**:
1. Login as student
2. Open an activity you haven't submitted
3. Look at the submission form

**Expected Result**:
- ✅ See "Turn In" button (blue)
- ✅ See "Mark as Done" button (gray) next to it
- ✅ Both buttons same height
- ✅ Buttons aligned horizontally

**Pass Criteria**: Both buttons visible and properly styled

---

### Test 4: Mark as Done Submission ✅

**Steps**:
1. Login as student
2. Open an activity without submission
3. Leave both text and file fields empty
4. Click "Mark as Done"
5. Read confirmation dialog
6. Click "OK"

**Expected Result**:
- ✅ Confirmation dialog appears
- ✅ Dialog explains what "Mark as Done" means
- ✅ After confirming, activity is submitted
- ✅ Success message shows
- ✅ Activity moves to "Submitted" tab
- ✅ Submission shows in activity details

**Pass Criteria**: Activity submitted without content/file

---

### Test 5: Text-Only Submission ✅

**Steps**:
1. Login as student
2. Open an activity without submission
3. Type text in "Your Work" field
4. Leave file field empty
5. Observe "Turn In" button

**Expected Result**:
- ✅ "Turn In" button becomes enabled (not grayed out)
- ✅ Can click "Turn In"
- ✅ Submission succeeds
- ✅ Text appears in submission

**Pass Criteria**: Can submit with text only

---

### Test 6: File-Only Submission ✅

**Steps**:
1. Login as student
2. Open an activity without submission
3. Leave text field empty
4. Attach a file
5. Observe "Turn In" button

**Expected Result**:
- ✅ "Turn In" button becomes enabled
- ✅ File preview shows
- ✅ Can click "Turn In"
- ✅ Submission succeeds
- ✅ File appears in submission

**Pass Criteria**: Can submit with file only

---

### Test 7: Form Labels Are Clear ✅

**Steps**:
1. Login as student
2. Open an activity without submission
3. Read the form labels

**Expected Result**:
- ✅ "Your Work" label says "(Optional)"
- ✅ "Attach File" label says "(Optional)"
- ✅ Help text says: "You can submit text, a file, or both. Use 'Mark as Done' if you submitted physical work."

**Pass Criteria**: Labels clearly indicate flexibility

---

### Test 8: Tab Filtering Works ✅

**Steps**:
1. Login as student with mixed activities
2. Navigate to class
3. Click "Assigned" tab
4. Click "Submitted" tab
5. Click "Missing" tab
6. Click "All" tab

**Expected Result**:
- ✅ "Assigned" shows only unsubmitted activities before deadline
- ✅ "Submitted" shows only submitted activities
- ✅ "Missing" shows only overdue unsubmitted activities
- ✅ "All" shows all activities
- ✅ Filtering is instant (no loading)

**Pass Criteria**: Each tab filters correctly

---

### Test 9: Teacher Views Mark as Done Submission ✅

**Steps**:
1. Student submits using "Mark as Done"
2. Login as teacher
3. View the activity
4. Look at student submissions

**Expected Result**:
- ✅ Submission shows for the student
- ✅ Indicates it's a "Mark as Done" submission
- ✅ Can grade the submission
- ✅ No content or file shown (as expected)

**Pass Criteria**: Teacher can see and grade Mark as Done submissions

---

### Test 10: Unsubmit Works for All Types ✅

**Steps**:
1. Login as student
2. Submit activity (any type: text, file, or Mark as Done)
3. Click "Unsubmit" button
4. Confirm unsubmit

**Expected Result**:
- ✅ Submission is removed
- ✅ Activity moves back to "Assigned" tab
- ✅ Can submit again
- ✅ Form is empty/reset

**Pass Criteria**: Unsubmit works for all submission types

---

## 🎯 Edge Cases to Test

### Edge Case 1: Student with No Submissions Yet
**Test**: Login as new student, view class
**Expected**: Tabs show with correct counts (Submitted: 0, etc.)

### Edge Case 2: Teacher Who Is Also Student
**Test**: User enrolled as teacher in Class A, student in Class B
**Expected**: 
- Class A: No tabs (teacher view)
- Class B: Tabs show (student view)

### Edge Case 3: Activity with No Deadline
**Test**: View activity without deadline
**Expected**: Activity appears in "Assigned" tab (not "Missing")

### Edge Case 4: Activity Submitted Exactly at Deadline
**Test**: Submit at exact deadline time
**Expected**: Submission accepted, appears in "Submitted" tab

### Edge Case 5: Large File Upload
**Test**: Try to attach file > 20MB
**Expected**: Error message, submit button disabled

---

## 🐛 Common Issues and Solutions

### Issue: Tabs Not Showing for Student

**Possible Causes**:
1. User is actually a teacher
2. Browser cache not cleared
3. JavaScript error

**Solution**:
1. Verify user role in database
2. Hard refresh (Ctrl+F5)
3. Check browser console for errors

---

### Issue: "Turn In" Button Always Disabled

**Possible Causes**:
1. JavaScript error
2. Event listener not attached
3. Validation function not working

**Solution**:
1. Check browser console
2. Verify `validateSubmissionFile()` is called
3. Check if `submission-content` and `submission-file` IDs exist

---

### Issue: "Mark as Done" Button Not Showing

**Possible Causes**:
1. User is teacher (button only for students)
2. Activity already submitted
3. Submissions closed

**Solution**:
1. Verify user is student
2. Check if `can_submit` is true
3. Verify activity accepts submissions

---

### Issue: Tabs Show for Teacher

**Possible Causes**:
1. Old cached JavaScript
2. User role not passed correctly

**Solution**:
1. Clear browser cache
2. Verify `loadClassActivities()` passes `user_role`
3. Check API response includes `user_role`

---

## 📊 Test Results Template

```
Test Date: ___________
Tester: ___________
Browser: ___________

[ ] Test 1: Student Sees Tabs
[ ] Test 2: Teacher Doesn't See Tabs
[ ] Test 3: Mark as Done Button
[ ] Test 4: Mark as Done Submission
[ ] Test 5: Text-Only Submission
[ ] Test 6: File-Only Submission
[ ] Test 7: Form Labels Are Clear
[ ] Test 8: Tab Filtering Works
[ ] Test 9: Teacher Views Mark as Done
[ ] Test 10: Unsubmit Works

Edge Cases:
[ ] Student with No Submissions
[ ] Teacher Who Is Also Student
[ ] Activity with No Deadline
[ ] Activity Submitted at Deadline
[ ] Large File Upload

Issues Found:
_________________________________
_________________________________
_________________________________

Overall Status: [ ] Pass [ ] Fail
```

---

## 🎬 Video Test Scenarios

### Scenario 1: Student Journey (2 minutes)
1. Login as student
2. Navigate to class
3. See tabs with counts
4. Click through each tab
5. Open activity
6. Type text only
7. Submit
8. Verify in "Submitted" tab

### Scenario 2: Mark as Done Journey (1 minute)
1. Login as student
2. Open activity
3. Click "Mark as Done"
4. Read confirmation
5. Confirm
6. Verify submission

### Scenario 3: Teacher Journey (1 minute)
1. Login as teacher
2. Navigate to class
3. Verify no tabs
4. See all activities
5. View student submissions
6. Grade a submission

---

## ✅ Sign-Off Checklist

Before marking as complete:

- [ ] All 10 main tests pass
- [ ] All 5 edge cases tested
- [ ] Tested in Chrome
- [ ] Tested in Firefox
- [ ] Tested in Safari
- [ ] Tested on mobile
- [ ] No console errors
- [ ] No visual glitches
- [ ] Performance acceptable
- [ ] Documentation reviewed

**Tested By**: ___________
**Date**: ___________
**Status**: [ ] Approved [ ] Needs Fixes

---

**Quick Test Time**: 15-20 minutes
**Full Test Time**: 30-40 minutes
**Recommended**: Test with real student and teacher accounts
