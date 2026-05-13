# Testing Checklist
## Assignment Editing & File Submission Features

**Test Date**: _____________  
**Tester**: _____________  
**Environment**: [ ] Development [ ] Staging [ ] Production

---

## Pre-Testing Setup

- [ ] Server is running (`npm start`)
- [ ] Database is accessible
- [ ] Email service is configured
- [ ] Upload directory exists and has write permissions
- [ ] Test accounts created (1 teacher, 2 students)
- [ ] Test class created with students enrolled
- [ ] Test activity created

---

## 1. Teacher: Edit Assignment Feature

### Basic Edit Functionality
- [ ] Edit button appears for teacher on activity details page
- [ ] Edit button does NOT appear for students
- [ ] Edit button does NOT appear in archived classes
- [ ] Clicking Edit button opens modal
- [ ] Modal displays with correct title "Edit Activity"
- [ ] Form is pre-filled with current activity data:
  - [ ] Title
  - [ ] Description
  - [ ] Deadline
  - [ ] Teacher notes
- [ ] Current attachments are displayed
- [ ] Can add new files via file input
- [ ] Cancel button closes modal without changes
- [ ] Close (X) button closes modal without changes

### Edit Operations
- [ ] Can update title only
- [ ] Can update description only
- [ ] Can update deadline only
- [ ] Can update teacher notes only
- [ ] Can add new files without losing existing files
- [ ] Can update multiple fields at once
- [ ] Form validation works (title required)
- [ ] Changes persist after save
- [ ] Activity details page refreshes with new data
- [ ] Success message appears after save

### Notifications
- [ ] Changing title triggers notifications
- [ ] Changing description triggers notifications
- [ ] Changing deadline triggers notifications
- [ ] Changing only teacher notes does NOT trigger notifications
- [ ] Students receive in-app notification
- [ ] Students receive email notification
- [ ] Notification message is accurate
- [ ] Notification includes activity name
- [ ] Notification describes what changed

### Security & Access Control
- [ ] Non-teachers cannot access edit endpoint (403 error)
- [ ] Teachers can only edit activities in their classes
- [ ] Cannot edit activities in archived classes
- [ ] Edit endpoint requires authentication
- [ ] Invalid activity ID returns 404

### Edge Cases
- [ ] Editing with very long title (>200 chars)
- [ ] Editing with very long description (>5000 chars)
- [ ] Editing with past deadline
- [ ] Editing with future deadline
- [ ] Editing with no deadline
- [ ] Adding 10 files at once
- [ ] Adding files with special characters in name
- [ ] Rapid successive edits
- [ ] Editing while students are viewing

---

## 2. Student: File Upload Feature

### File Input Display
- [ ] File input appears on activity details page
- [ ] File input accepts correct file types
- [ ] File input shows supported formats hint
- [ ] File input shows size limit (20MB)
- [ ] Submit button is initially disabled
- [ ] Instructions are clear

### File Selection
- [ ] Can select .docx file
- [ ] Can select .pdf file
- [ ] Can select .pptx file
- [ ] Can select .jpg file
- [ ] Can select .png file
- [ ] Cannot select .exe file (rejected)
- [ ] Cannot select .zip file (rejected)
- [ ] File preview appears after selection
- [ ] File preview shows correct name
- [ ] File preview shows correct size
- [ ] Can clear selected file

### File Validation
- [ ] Files under 20MB are accepted
- [ ] Files over 20MB are rejected with error
- [ ] Error message is clear and helpful
- [ ] Invalid file types show error message
- [ ] Submit button enables when file selected
- [ ] Submit button enables when text entered
- [ ] Submit button enables when both provided
- [ ] Submit button stays disabled with neither

### Submission Process
- [ ] Can submit with text only
- [ ] Can submit with file only
- [ ] Can submit with both text and file
- [ ] Cannot submit with neither (button disabled)
- [ ] Confirmation dialog appears
- [ ] Loading indicator shows during upload
- [ ] Success message appears after submission
- [ ] Page refreshes to show submission
- [ ] Submitted file is displayed
- [ ] Can download own submitted file

### Submission Display
- [ ] Submission status shows "Submitted"
- [ ] Submission date is displayed
- [ ] Text content is displayed (if provided)
- [ ] File attachment is displayed (if provided)
- [ ] Download button works
- [ ] Edit button appears (if not archived)
- [ ] Grade is displayed (if graded)
- [ ] Feedback is displayed (if provided)

### Security & Access Control
- [ ] Only students can submit work
- [ ] Teachers cannot submit work (403 error)
- [ ] Cannot submit in archived classes
- [ ] Cannot submit without authentication
- [ ] Cannot submit to activities in other classes
- [ ] File is stored securely
- [ ] Filename is sanitized
- [ ] File path is not exposed to client

### Edge Cases
- [ ] Submitting file exactly 20MB
- [ ] Submitting file with no extension
- [ ] Submitting file with multiple dots in name
- [ ] Submitting file with special characters
- [ ] Submitting file with very long name
- [ ] Submitting after deadline (warning shown)
- [ ] Re-submitting (updates previous submission)
- [ ] Network interruption during upload
- [ ] Submitting empty text field with file
- [ ] Submitting whitespace-only text with file

---

## 3. Teacher: Submission Review Feature

### Student List Display
- [ ] All enrolled students are shown
- [ ] Students who submitted show "Submitted" badge
- [ ] Students who didn't submit show "Not Submitted"
- [ ] List is sorted appropriately
- [ ] Student names are displayed
- [ ] Submission dates are displayed (if submitted)

### Submission Content Display
- [ ] Text content is displayed (if provided)
- [ ] File attachment is displayed (if provided)
- [ ] File name is displayed correctly
- [ ] Download button is present for files
- [ ] Multiple submissions are displayed correctly
- [ ] Empty submissions show appropriate message

### Download Functionality
- [ ] Can download student files
- [ ] Download uses original filename
- [ ] Download works for all file types
- [ ] Cannot download files from other classes
- [ ] Download requires authentication
- [ ] Download fails gracefully if file missing

### Grading Interface
- [ ] Grade button appears for ungraded submissions
- [ ] Grade button does NOT appear for non-submissions
- [ ] Can grade submissions with files
- [ ] Can grade submissions with text
- [ ] Can grade submissions with both
- [ ] Graded submissions show score
- [ ] Graded submissions show feedback

### Security & Access Control
- [ ] Only teachers can view all submissions
- [ ] Students cannot view other students' submissions
- [ ] Teachers can only view submissions in their classes
- [ ] Download endpoint validates permissions
- [ ] Cannot access submissions without authentication

### Edge Cases
- [ ] Class with 0 submissions
- [ ] Class with 100% submission rate
- [ ] Class with mixed submission types
- [ ] Very long text submissions
- [ ] Very large file submissions
- [ ] Submissions with special characters
- [ ] Multiple files from same student (re-submission)

---

## 4. Backend & Security

### File Upload Security
- [ ] Filenames are sanitized
- [ ] File types are validated (MIME + extension)
- [ ] File sizes are enforced (20MB max)
- [ ] Files are stored outside web root
- [ ] Files have unique names (no overwrites)
- [ ] Upload directory has correct permissions
- [ ] Malicious filenames are rejected
- [ ] Path traversal attempts are blocked

### API Security
- [ ] All endpoints require authentication
- [ ] Role-based access control works
- [ ] Invalid tokens are rejected
- [ ] Expired tokens are rejected
- [ ] CSRF protection is enabled (if applicable)
- [ ] Rate limiting is working (if enabled)
- [ ] SQL injection attempts fail
- [ ] XSS attempts are escaped

### Data Validation
- [ ] Server validates all input fields
- [ ] Empty required fields are rejected
- [ ] Invalid data types are rejected
- [ ] SQL injection attempts are blocked
- [ ] File upload limits are enforced
- [ ] Deadline format is validated
- [ ] Activity ID is validated
- [ ] User ID is validated

### Error Handling
- [ ] Invalid requests return appropriate status codes
- [ ] Error messages are user-friendly
- [ ] Sensitive information is not exposed in errors
- [ ] Server errors are logged
- [ ] Client receives meaningful error messages
- [ ] File upload errors are handled gracefully
- [ ] Database errors are handled gracefully
- [ ] Network errors are handled gracefully

---

## 5. Notification System

### In-App Notifications
- [ ] Notifications appear in notification center
- [ ] Notification count updates
- [ ] Notification title is correct
- [ ] Notification message is correct
- [ ] Notification links to correct activity
- [ ] Can mark notification as read
- [ ] Can mark all notifications as read
- [ ] Unread notifications are highlighted

### Email Notifications
- [ ] Emails are sent to correct recipients
- [ ] Email subject is correct
- [ ] Email body is formatted correctly
- [ ] Email includes activity name
- [ ] Email includes change description
- [ ] Email includes link to activity
- [ ] Email sender is correct
- [ ] Email delivery is confirmed (check logs)

### Notification Triggers
- [ ] Title change triggers notification
- [ ] Description change triggers notification
- [ ] Deadline change triggers notification
- [ ] Teacher notes change does NOT trigger notification
- [ ] Adding files does NOT trigger notification
- [ ] Multiple changes trigger single notification
- [ ] Notification sent to all enrolled students
- [ ] Notification NOT sent to kicked students

---

## 6. Archive Protection

### Archived Classes
- [ ] Edit button does NOT appear in archived classes
- [ ] Cannot submit work in archived classes
- [ ] Submit button is disabled/hidden
- [ ] Archive notice is displayed
- [ ] Can view activity details (read-only)
- [ ] Can view previous submissions (read-only)
- [ ] Can download previous submissions
- [ ] Cannot edit previous submissions
- [ ] Teachers cannot edit activities in archived classes
- [ ] API rejects submissions to archived classes

---

## 7. User Experience

### Loading States
- [ ] Loading spinner appears during file upload
- [ ] Loading spinner appears during edit save
- [ ] Loading spinner appears during page load
- [ ] Loading spinner disappears after completion
- [ ] UI is disabled during loading

### Success Messages
- [ ] Success toast appears after edit
- [ ] Success toast appears after submission
- [ ] Success toast appears after download
- [ ] Success messages are clear and positive
- [ ] Success messages auto-dismiss

### Error Messages
- [ ] Error toast appears on failure
- [ ] Error messages are clear and helpful
- [ ] Error messages suggest solutions
- [ ] Error messages don't expose sensitive info
- [ ] Error messages auto-dismiss or are dismissible

### Responsive Design
- [ ] Works on desktop (1920x1080)
- [ ] Works on laptop (1366x768)
- [ ] Works on tablet (768x1024)
- [ ] Works on mobile (375x667)
- [ ] File input is usable on mobile
- [ ] Modals are usable on mobile
- [ ] Buttons are tappable on mobile
- [ ] Text is readable on all devices

---

## 8. Performance

### File Upload Performance
- [ ] Small files (<1MB) upload quickly
- [ ] Medium files (5-10MB) upload reasonably
- [ ] Large files (15-20MB) upload successfully
- [ ] Upload progress is indicated
- [ ] Multiple uploads don't crash browser
- [ ] Server handles concurrent uploads

### Page Load Performance
- [ ] Activity details page loads quickly
- [ ] Submission list loads quickly
- [ ] File downloads start promptly
- [ ] Modal opens without delay
- [ ] No memory leaks during extended use

### Database Performance
- [ ] Queries execute efficiently
- [ ] No N+1 query problems
- [ ] Indexes are used appropriately
- [ ] Large result sets are handled

---

## 9. Browser Compatibility

### Desktop Browsers
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Mobile Browsers
- [ ] Chrome Mobile (Android)
- [ ] Safari Mobile (iOS)
- [ ] Firefox Mobile
- [ ] Samsung Internet

### Features to Test Per Browser
- [ ] File input works
- [ ] File upload works
- [ ] Download works
- [ ] Modals display correctly
- [ ] Notifications work
- [ ] Responsive design works

---

## 10. Integration Testing

### End-to-End Workflows
- [ ] Teacher creates activity → Student submits → Teacher reviews
- [ ] Teacher edits activity → Student receives notification → Student views changes
- [ ] Student submits file → Teacher downloads → Teacher grades
- [ ] Teacher archives class → Student cannot submit
- [ ] Student joins class → Submits work → Teacher sees submission

### Multi-User Scenarios
- [ ] Multiple students submit simultaneously
- [ ] Teacher edits while students are viewing
- [ ] Multiple teachers in same class
- [ ] Student re-submits multiple times
- [ ] Teacher grades multiple submissions

---

## Bug Tracking

### Issues Found

| # | Severity | Description | Steps to Reproduce | Status |
|---|----------|-------------|-------------------|--------|
| 1 |          |             |                   |        |
| 2 |          |             |                   |        |
| 3 |          |             |                   |        |

**Severity Levels:**
- **Critical**: Blocks core functionality
- **High**: Major feature broken
- **Medium**: Minor feature issue
- **Low**: Cosmetic or edge case

---

## Sign-Off

### Testing Complete
- [ ] All critical tests passed
- [ ] All high-priority tests passed
- [ ] Known issues documented
- [ ] Performance is acceptable
- [ ] Security is verified
- [ ] Ready for production

**Tester Signature**: _____________  
**Date**: _____________

**Reviewer Signature**: _____________  
**Date**: _____________

---

## Notes

_Use this space for additional observations, suggestions, or concerns:_

```
[Your notes here]
```

---

## Next Steps

After testing completion:
1. [ ] Fix critical bugs
2. [ ] Fix high-priority bugs
3. [ ] Document known issues
4. [ ] Update user documentation
5. [ ] Deploy to staging
6. [ ] Conduct user acceptance testing
7. [ ] Deploy to production
8. [ ] Monitor for issues

---

**Testing Status**: [ ] Not Started [ ] In Progress [ ] Complete  
**Production Ready**: [ ] Yes [ ] No [ ] Pending Fixes
