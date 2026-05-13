# Testing Guide: Inline Grading & Max Score Feature

## Quick Start Testing

### Prerequisites
1. Start the backend server: `cd Backend && node server.js`
2. Open the application in a browser
3. Have at least one teacher account and one student account
4. Have at least one active class with both accounts enrolled

## Test Scenario 1: Create Activity with Custom Max Score

### Steps
1. **Login as Teacher**
2. **Navigate to a class**
3. **Click "Create Activity"**
4. **Fill in the form:**
   - Title: "Math Quiz"
   - Description: "Complete all 10 questions"
   - Deadline: Tomorrow
   - **Max Score: 50** ← NEW FIELD
   - Toggle: ON (accepting submissions)
5. **Click "Create Activity"**

### Expected Results
- ✅ Activity created successfully
- ✅ Toast notification appears
- ✅ Activity appears in class activities list
- ✅ Students receive notification

### Verification
1. Open the activity details
2. Check that max_score is saved (you'll see it when grading)

---

## Test Scenario 2: Edit Activity Max Score

### Steps
1. **Login as Teacher**
2. **Open an existing activity**
3. **Click "Edit" button**
4. **Change Max Score from 100 to 75**
5. **Click "Save Changes"**

### Expected Results
- ✅ Activity updated successfully
- ✅ Max score changed to 75
- ✅ Existing grades remain valid

### Verification
1. Return to activity details
2. Check inline grading shows "/ 75" instead of "/ 100"

---

## Test Scenario 3: Inline Grading (Main Feature)

### Setup
1. **Login as Student**
2. **Submit work for an activity** (with or without file)
3. **Logout**

### Steps
1. **Login as Teacher**
2. **Open the activity with student submission**
3. **Scroll to "Student Submissions" section**
4. **You should see:**
   - Student name
   - Submission date
   - Submitted content/file
   - **Inline grading interface** (NEW)
     - Score input box
     - "/ 100" (or custom max score)
     - Checkmark save button
     - Feedback textarea

5. **Enter a score** (e.g., 85)
6. **Add feedback** (optional): "Great work!"
7. **Click the checkmark button** ✓

### Expected Results
- ✅ "Grade saved successfully!" toast appears
- ✅ Checkmark button briefly turns green (animation)
- ✅ No modal popup
- ✅ Grade remains visible in the input field
- ✅ Student receives notification

### Verification
1. Refresh the page
2. Grade should still be visible
3. Login as student
4. Check activity - should see grade and feedback

---

## Test Scenario 4: Validation Testing

### Test 4.1: Score Exceeds Max
1. **Open activity with max_score = 100**
2. **Try to enter score = 150**
3. **Click save**

**Expected**: Error toast "Score must be between 0 and 100"

### Test 4.2: Negative Score
1. **Try to enter score = -10**
2. **Click save**

**Expected**: Error toast "Score must be between 0 and -10"

### Test 4.3: Zero Max Score
1. **Try to create activity with max_score = 0**

**Expected**: Error toast "Max score must be greater than 0"

### Test 4.4: Empty Score
1. **Leave score field empty**
2. **Click save**

**Expected**: Error toast about invalid score

---

## Test Scenario 5: "Mark as Done" Submissions

### Setup
1. **Login as Student**
2. **Open an activity**
3. **Click "Turn In" without adding text or file**
4. **Confirm submission**

### Steps
1. **Login as Teacher**
2. **Open the activity**
3. **Find the student's submission**
4. **You should see:**
   - "Turned in (No attachment)" message
   - Inline grading interface still available

5. **Enter a score** (e.g., 100)
6. **Add feedback**: "Received your hardcopy work"
7. **Click save**

### Expected Results
- ✅ Grade saves successfully
- ✅ No errors about missing files
- ✅ Student can see grade

---

## Test Scenario 6: Edit Existing Grade

### Steps
1. **Open activity with already graded submission**
2. **Inline grading should show:**
   - Current score in input field
   - Current feedback in textarea

3. **Change score** from 85 to 90
4. **Update feedback**
5. **Click save**

### Expected Results
- ✅ Grade updated successfully
- ✅ New score and feedback saved
- ✅ Student receives update notification

---

## Test Scenario 7: Multiple Submissions

### Setup
- Have 3+ students submit work for the same activity

### Steps
1. **Login as Teacher**
2. **Open the activity**
3. **Scroll through submissions**
4. **Grade each one using inline interface**

### Expected Results
- ✅ Each submission has its own inline grading section
- ✅ Scores don't interfere with each other
- ✅ All grades save independently
- ✅ Visual feedback for each save

---

## Test Scenario 8: Mobile Responsiveness

### Steps
1. **Open browser DevTools**
2. **Switch to mobile view** (iPhone/Android)
3. **Login as Teacher**
4. **Open activity with submissions**
5. **Try inline grading on mobile**

### Expected Results
- ✅ Inline grading displays correctly
- ✅ Input fields are touch-friendly
- ✅ Save button is easily clickable
- ✅ No horizontal scrolling required

---

## Test Scenario 9: File Viewing Integration

### Steps
1. **Student submits PDF or image**
2. **Teacher opens activity**
3. **In inline grading section, click "View" button**

### Expected Results
- ✅ File opens in new tab
- ✅ No "Access Token Required" error
- ✅ Can view and grade in same workflow

---

## Test Scenario 10: Student View

### Steps
1. **Login as Student**
2. **Open graded activity**
3. **Check submission section**

### Expected Results
- ✅ Grade displayed: "85 / 100"
- ✅ Feedback visible (if provided)
- ✅ "Submission locked" message shown
- ✅ Cannot unsubmit after grading

---

## Regression Testing

### Verify Old Features Still Work

#### ✅ Submission Toggle
- Create activity with toggle OFF
- Students cannot submit
- Turn toggle ON
- Students can now submit

#### ✅ Deadline Lock
- Create activity with past deadline
- Students cannot submit
- Teacher can still grade

#### ✅ Archive Lock
- Archive a class
- Students cannot submit
- Teacher can still view/grade

#### ✅ File Attachments
- Teacher can attach files to activity
- Students can attach files to submission
- View/Download buttons work

#### ✅ Notifications
- Activity creation sends notifications
- Activity updates send notifications
- Grading sends notifications

---

## Performance Testing

### Test with Large Dataset
1. **Create activity**
2. **Have 50+ students submit**
3. **Open activity as teacher**

### Expected Results
- ✅ Page loads in < 3 seconds
- ✅ Inline grading renders smoothly
- ✅ No lag when scrolling
- ✅ Save operations complete quickly

---

## Browser Compatibility

Test in:
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)
- ✅ Mobile Safari (iOS)
- ✅ Chrome Mobile (Android)

---

## Common Issues & Solutions

### Issue: "Max score must be greater than 0"
**Solution**: Ensure max_score field has a value > 0

### Issue: "Score must be between 0 and X"
**Solution**: Enter a score within the valid range

### Issue: Grade doesn't save
**Solution**: 
1. Check browser console for errors
2. Verify backend is running
3. Check authentication token is valid

### Issue: Inline grading not visible
**Solution**:
1. Verify you're logged in as teacher
2. Ensure student has submitted work
3. Clear browser cache and refresh

---

## Success Criteria

All tests pass when:
- ✅ Max score can be set on create/edit
- ✅ Inline grading works without modal
- ✅ Validation prevents invalid scores
- ✅ "Mark as Done" submissions can be graded
- ✅ File viewing works with inline grading
- ✅ Mobile interface is usable
- ✅ No regression in existing features
- ✅ Performance is acceptable

---

## Reporting Issues

If you find a bug, report:
1. **Steps to reproduce**
2. **Expected behavior**
3. **Actual behavior**
4. **Browser/device**
5. **Console errors** (if any)
6. **Screenshots** (if applicable)

---

## Quick Smoke Test (5 minutes)

1. ✅ Create activity with max_score = 50
2. ✅ Student submits work
3. ✅ Teacher grades inline (score = 45)
4. ✅ Student sees grade "45 / 50"
5. ✅ Edit activity, change max_score to 60
6. ✅ Grade still shows correctly

**If all pass → Feature is working! 🎉**
