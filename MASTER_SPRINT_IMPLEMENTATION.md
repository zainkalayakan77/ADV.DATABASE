# Master Sprint: UI Overhaul, Logic Fixes, and Security

## Implementation Status: IN PROGRESS

## Overview
This document tracks the comprehensive overhaul of the Student Activity Tracker system, focusing on UI improvements, submission logic, and security enhancements.

---

## 1. Critical Fix: Restore Missing Activity Content ✅

### Issue
The "Activities" tab shows blank screen when no activities exist.

### Solution
- ✅ Add graceful empty state handling in `renderClassActivities()`
- ✅ Verify `room_id` (class_id) is correctly passed to backend
- ✅ Backend query already filters by class_id correctly

### Files Modified
- `Frontend/js/classes.js` - renderClassActivities()

---

## 2. Architecture: Full-Page Transition (No More Modals) 🔄

### Requirement
Remove all popup modals for Create Activity, Edit Activity, and Student Submissions.

### Implementation
- ✅ Dedicated pages already exist in HTML:
  - `#create-activity-page`
  - `#edit-activity-page`
  - `#activity-details-page`
- 🔄 Remove modal-based functions
- 🔄 Update all onclick handlers to use page navigation
- 🔄 Make submission portal permanent section on Activity Detail page

### Files to Modify
- `Frontend/index.html` - Remove modal HTML
- `Frontend/js/classes.js` - Remove modal functions, update navigation
- `Frontend/css/styles.css` - Remove modal styles

---

## 3. Submission Logic: Dual-Lock System 🔄

### Hierarchy of Locks
1. **Toggle Lock**: `is_accepting_submissions` (Boolean) - Teacher control
2. **Deadline Lock**: `due_date` - Automatic time-based lock
3. **Teacher Override**: Teachers can always edit

### Database Changes
- ✅ `is_accepting_submissions` column already exists
- ✅ `deadline` column already exists (named `deadline` not `due_date`)

### Backend Changes Needed
- 🔄 Update `submitWork()` to check both locks
- 🔄 Update `unsubmitWork()` to check both locks
- 🔄 Add deadline validation logic

### Frontend Changes Needed
- 🔄 Display lock status clearly
- 🔄 Disable buttons when locked
- 🔄 Show appropriate messages for each lock type

### Files to Modify
- `Backend/Controllers/activityController.js`
- `Frontend/js/classes.js`

---

## 4. Student File Management: Drafts & Unsubmitting 🔄

### Requirements
- **Pre-Submission**: Add/Remove files with X icon before "Turn In"
- **Post-Submission**: UI locked, show submitted files
- **Unsubmit Flow**: Revert to draft, allow file changes
- **Remove**: "Edit Submission" button (use Unsubmit only)

### Implementation
- 🔄 Add draft file preview with remove buttons
- 🔄 Lock UI after submission
- ✅ Unsubmit endpoint already exists
- 🔄 Update UI to show clear draft vs submitted states

### Files to Modify
- `Frontend/js/classes.js` - Submission UI
- `Frontend/css/styles.css` - Draft file styling

---

## 5. Teacher File Management: Editing Attachments 🔄

### Requirements
- List all current attachments with Remove (Trash icon)
- Allow deletion without forced upload
- All edits independent (Title, Description, Toggle)

### Implementation
- ✅ Backend already supports `removed_files` parameter
- ✅ File removal logic already implemented
- 🔄 Update Edit Activity Page UI to show file list with remove buttons
- 🔄 Ensure form submission includes removed files

### Files to Modify
- `Frontend/js/classes.js` - Edit activity page
- `Frontend/index.html` - Edit activity form

---

## 6. Dual-Channel Notifications (In-App & Gmail) 🔄

### Triggers
- Student is Kicked
- Activity is Created
- Deadline is Updated

### Implementation
- ✅ `sendDualNotification()` function already exists in emailService
- ✅ Activity update already sends dual notifications
- 🔄 Verify kick notification sends dual channel
- 🔄 Verify activity creation sends dual channel
- 🔄 Add error handling for failed channels

### Files to Modify
- `Backend/Controllers/activityController.js` - createActivity()
- `Backend/Controllers/memberController.js` - kickMember()
- `Backend/services/emailService.js` - Error handling

---

## Testing Checklist

### Activities Tab
- [ ] Empty state shows "No activities yet" message
- [ ] Activities load correctly with room_id
- [ ] No blank screens

### Page Navigation
- [ ] Create Activity opens dedicated page (not modal)
- [ ] Edit Activity opens dedicated page (not modal)
- [ ] Activity Details shows submission portal inline
- [ ] Back buttons work correctly

### Submission Locks
- [ ] Toggle OFF blocks submissions
- [ ] Past deadline blocks submissions (with warning)
- [ ] Teacher can always edit activity
- [ ] Lock messages are clear and specific

### Student File Management
- [ ] Can add/remove files in draft mode
- [ ] X icon removes files before submission
- [ ] Turn In button works correctly
- [ ] Unsubmit reverts to draft
- [ ] Cannot edit after submission (must unsubmit)

### Teacher File Management
- [ ] Can remove attachments without uploading new ones
- [ ] Trash icon removes files
- [ ] Can edit title/description independently
- [ ] Toggle works independently

### Notifications
- [ ] Kick sends in-app + Gmail
- [ ] Activity creation sends in-app + Gmail
- [ ] Deadline update sends in-app + Gmail
- [ ] Failed channel doesn't block the other

---

## Database Schema Verification

```sql
-- Activities table already has required columns:
- deadline DATETIME
- is_accepting_submissions BOOLEAN DEFAULT TRUE
- attachment_path VARCHAR(500)
- teacher_notes TEXT

-- No schema changes needed! ✅
```

---

## API Endpoints Status

### Existing & Working
- ✅ POST `/api/activities/class/:classId` - Create activity
- ✅ GET `/api/activities/:activityId` - Get activity details
- ✅ PUT `/api/activities/:activityId` - Update activity
- ✅ POST `/api/activities/:activityId/submit` - Submit work
- ✅ DELETE `/api/activities/:activityId/unsubmit` - Unsubmit work
- ✅ POST `/api/members/classes/:classId/kick` - Kick member

### Needs Enhancement
- 🔄 Submit endpoint - Add dual-lock validation
- 🔄 Unsubmit endpoint - Add dual-lock validation
- 🔄 Create endpoint - Add dual notification
- 🔄 Kick endpoint - Verify dual notification

---

## Priority Order

1. **HIGH**: Fix blank Activities tab (empty state)
2. **HIGH**: Implement dual-lock system for submissions
3. **MEDIUM**: Remove modals, use dedicated pages
4. **MEDIUM**: Student draft file management UI
5. **MEDIUM**: Teacher file removal UI
6. **LOW**: Verify dual notifications on all triggers

---

## Notes

- Most backend logic already exists and is solid
- Focus is on UI/UX improvements and lock validation
- No database migrations needed
- Existing file upload/download system works well
