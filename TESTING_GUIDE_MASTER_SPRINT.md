# Testing Guide: Master Sprint Implementation

## Quick Test Scenarios

### 1. Test Empty Activities Tab ✅

**Scenario**: View class with no activities

**Steps**:
1. Login as Student
2. Navigate to a class with 0 activities
3. Click "Activities" tab

**Expected Result**:
- See large icon (tasks icon)
- See heading "No Activities Yet"
- See helpful message about checking back later
- NO blank white screen

---

### 2. Test Toggle Lock (Teacher Control) ✅

**Scenario A**: Teacher closes submissions

**Steps**:
1. Login as Teacher
2. Go to any activity
3. Click "Edit" button
4. Uncheck "Open for Submissions" toggle
5. Save changes
6. Login as Student
7. View the same activity

**Expected Result**:
- Student sees yellow banner: "🚫 Locked: Submissions closed by teacher"
- Submit button is disabled or hidden
- Clear message explaining teacher closed submissions

**Scenario B**: Teacher reopens submissions

**Steps**:
1. Login as Teacher
2. Edit same activity
3. Check "Open for Submissions" toggle
4. Save changes
5. Login as Student
6. Refresh activity page

**Expected Result**:
- Student sees green banner: "✅ Open: Submissions are currently accepted"
- Submit button is enabled
- Can submit work normally

---

### 3. Test Deadline Lock (Automatic) ✅

**Scenario**: Submit after deadline

**Steps**:
1. Login as Teacher
2. Create activity with deadline in the past (e.g., yesterday)
3. Ensure "Open for Submissions" is checked
4. Login as Student
5. Try to submit work

**Expected Result**:
- Student sees red banner: "🕐 Locked: Deadline passed on [date]"
- Submit button is disabled
- Error message shows specific deadline date
- Cannot submit even though toggle is ON

---

### 4. Test Lock Priority ✅

**Scenario**: Multiple locks active

**Steps**:
1. Create activity with:
   - Toggle OFF
   - Deadline in the past
2. Login as Student
3. View activity

**Expected Result**:
- Shows TOGGLE lock message (yellow banner)
- Does NOT show deadline lock (toggle has priority)
- Clear that teacher control overrides deadline

---

### 5. Test Unsubmit with Locks ✅

**Scenario A**: Unsubmit before grading

**Steps**:
1. Student submits work
2. Activity has toggle ON and deadline not passed
3. Student clicks "Unsubmit"

**Expected Result**:
- Work is unsubmitted
- Returns to draft mode
- Can modify and resubmit

**Scenario B**: Unsubmit after grading

**Steps**:
1. Student submits work
2. Teacher grades submission
3. Student tries to unsubmit

**Expected Result**:
- Unsubmit button is hidden or disabled
- Shows gray banner: "🔒 Submission locked because grading has started"
- Cannot unsubmit

**Scenario C**: Unsubmit after deadline

**Steps**:
1. Student submits work before deadline
2. Deadline passes
3. Student tries to unsubmit

**Expected Result**:
- Unsubmit button is disabled
- Error message: "Deadline has passed"
- Cannot unsubmit even if not graded

---

### 6. Test Activity Creation Notifications ✅

**Scenario**: Teacher creates new activity

**Steps**:
1. Login as Teacher
2. Create new activity with title "Test Activity"
3. Add deadline
4. Save activity
5. Check student accounts

**Expected Result**:
- Each student receives in-app notification (bell icon)
- Each student receives email notification
- Notification includes:
  - Activity title
  - Deadline (if set)
  - Teacher name
  - Link to activity

**Verification**:
```bash
# Check backend logs for:
"Activity created successfully"
"notifications_sent: true"

# Check email service logs for:
"Email sent to: [student email]"
"Template: activityCreated"
```

---

### 7. Test Kick Notifications ✅

**Scenario**: Teacher kicks student

**Steps**:
1. Login as Teacher
2. Go to class members
3. Click "Kick" on a student
4. Provide reason: "Test kick"
5. Confirm kick
6. Check kicked student account

**Expected Result**:
- Student receives in-app notification
- Student receives email with:
  - Class name
  - Teacher name
  - Reason: "Test kick"
  - Instructions to request rejoin
- Student cannot access class
- Student can request to rejoin

---

### 8. Test Archive Lock ✅

**Scenario**: Submit in archived class

**Steps**:
1. Login as Teacher
2. Archive a class
3. Login as Student
4. Try to view activities in archived class

**Expected Result**:
- Student sees "Read-Only Mode" banner
- Cannot submit new work
- Can view existing submissions
- All submit buttons disabled

---

### 9. Test Lock Status Display ✅

**Scenario**: Visual clarity of lock status

**Steps**:
1. Create 4 activities:
   - Activity A: Toggle ON, deadline future
   - Activity B: Toggle OFF, deadline future
   - Activity C: Toggle ON, deadline past
   - Activity D: Archived class
2. Login as Student
3. View each activity

**Expected Result**:
- Activity A: Green banner "Open"
- Activity B: Yellow banner "Submissions closed by teacher"
- Activity C: Red banner "Deadline passed on [date]"
- Activity D: Gray banner "Class is archived"

---

### 10. Test Notification Failure Handling ✅

**Scenario**: Email service fails

**Steps**:
1. Temporarily disable email service (or use invalid SMTP)
2. Create new activity
3. Check backend logs

**Expected Result**:
- Activity is still created successfully
- In-app notifications are still sent
- Backend logs show email error but doesn't crash
- Response includes "notifications_sent: true" (partial success)

---

## Automated Test Commands

### Backend Tests
```bash
# Test activity creation
curl -X POST http://localhost:5000/api/activities/class/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Activity","deadline":"2026-05-10T23:59:59"}'

# Test submit with toggle OFF
curl -X POST http://localhost:5000/api/activities/1/submit \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "content=Test submission"

# Expected: 403 error with lock_type: "toggle"

# Test submit after deadline
curl -X POST http://localhost:5000/api/activities/2/submit \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "content=Test submission"

# Expected: 403 error with lock_type: "deadline"
```

### Database Verification
```sql
-- Check activity settings
SELECT activity_id, title, is_accepting_submissions, deadline 
FROM Activities 
WHERE class_id = 1;

-- Check notifications sent
SELECT * FROM Notifications 
WHERE type = 'system' 
ORDER BY created_at DESC 
LIMIT 10;

-- Check enrollment status
SELECT u.name, e.status, e.kicked_at 
FROM Enrollments e 
JOIN Users u ON e.user_id = u.user_id 
WHERE e.class_id = 1;
```

---

## Browser Console Tests

### Test Lock Status Calculation
```javascript
// Open browser console on activity details page
// Check lock status variables
console.log('Toggle:', activity.is_accepting_submissions);
console.log('Deadline:', activity.deadline);
console.log('Is Past:', new Date() > new Date(activity.deadline));
console.log('Is Archived:', is_archived);
```

### Test Notification Display
```javascript
// Check if notifications are loaded
console.log('Notifications:', notifications);

// Check notification count
console.log('Unread count:', notifications.filter(n => !n.is_read).length);
```

---

## Performance Tests

### Notification Sending Speed
**Test**: Create activity in class with 50 students

**Expected**:
- Activity creation: < 2 seconds
- Notification sending: Async, doesn't block response
- All notifications sent within 30 seconds

### Lock Check Performance
**Test**: Submit work with all locks checked

**Expected**:
- Lock validation: < 100ms
- Database queries: < 50ms
- Total response time: < 200ms

---

## Edge Cases

### Edge Case 1: Deadline exactly now
**Setup**: Set deadline to current time (to the second)
**Expected**: Should allow submission (not past yet)

### Edge Case 2: Toggle changed during submission
**Setup**: Student starts submitting, teacher closes toggle mid-submit
**Expected**: Submission fails with toggle lock error

### Edge Case 3: Multiple file uploads
**Setup**: Upload 10 files (max limit)
**Expected**: All files uploaded successfully

### Edge Case 4: Notification to deleted user
**Setup**: Delete user, then create activity
**Expected**: Notification fails gracefully, doesn't crash

---

## Regression Tests

### Ensure Existing Features Still Work

1. ✅ **Class Creation**: Can still create classes
2. ✅ **Join Class**: Can still join with code
3. ✅ **Activity Editing**: Can still edit activities
4. ✅ **Grading**: Can still grade submissions
5. ✅ **File Download**: Can still download attachments
6. ✅ **Archive/Unarchive**: Can still archive classes
7. ✅ **Dashboard**: Dashboard still loads correctly
8. ✅ **Reports**: Reports still generate

---

## User Acceptance Testing

### Teacher Perspective
- [ ] Can I easily control when students can submit?
- [ ] Do I get notified when students request to rejoin?
- [ ] Can I see which lock is active?
- [ ] Are error messages clear?

### Student Perspective
- [ ] Do I understand why I can't submit?
- [ ] Can I see the deadline clearly?
- [ ] Do I get notified about new activities?
- [ ] Can I unsubmit before grading?

---

## Bug Report Template

If you find issues, report using this format:

```
**Bug Title**: [Brief description]

**Severity**: Critical / High / Medium / Low

**Steps to Reproduce**:
1. 
2. 
3. 

**Expected Result**:
[What should happen]

**Actual Result**:
[What actually happened]

**Screenshots**:
[Attach if applicable]

**Browser/Environment**:
- Browser: 
- OS: 
- User Role: 

**Console Errors**:
[Paste any console errors]
```

---

## Sign-Off Checklist

Before marking testing complete:

- [ ] All 10 test scenarios passed
- [ ] No console errors during testing
- [ ] Notifications received (in-app + email)
- [ ] Lock system works correctly
- [ ] Empty states display properly
- [ ] No regression in existing features
- [ ] Performance is acceptable
- [ ] Edge cases handled gracefully
- [ ] User feedback is positive
- [ ] Documentation is accurate

---

## Contact for Issues

If you encounter problems during testing:
1. Check backend logs: `Backend/server.js` console output
2. Check browser console for frontend errors
3. Verify database state with SQL queries above
4. Review implementation in `MASTER_SPRINT_COMPLETED.md`
