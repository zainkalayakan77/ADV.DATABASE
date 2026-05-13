# Edit Activity Page - Quick Reference

## Button Configuration

### All Buttons in Edit Activity Page

| Location | Button | Type | Function | Purpose |
|----------|--------|------|----------|---------|
| Header | **Back** | `button` | `cancelEditActivity()` | Navigate back without saving |
| Footer | **Delete Activity** | `button` | `deleteActivityConfirm()` | Open delete confirmation |
| Footer | **Cancel** | `button` | `cancelEditActivity()` | Navigate back without saving |
| Footer | **Save Changes** | `submit` | `handleEditActivityPage()` | Submit form and save |

### Delete Confirmation Modal Buttons

| Button | Type | Function | Purpose |
|--------|------|----------|---------|
| **X** (close) | `button` | `closeDeleteActivityModal()` | Cancel deletion |
| **Cancel** | `button` | `closeDeleteActivityModal()` | Cancel deletion |
| **Delete Permanently** | `button` | `confirmDeleteActivity()` | Execute deletion |

---

## Key Functions

### Navigation Functions

```javascript
// Cancel editing and return to previous page
cancelEditActivity(event)
// - Prevents form submission
// - Navigates to previous page
// - Resets state
// - NO API calls
```

### Deletion Functions

```javascript
// Step 1: Open confirmation modal
deleteActivityConfirm(event)
// - Validates activity ID
// - Shows confirmation modal
// - Prevents form submission

// Step 2: Close modal (cancel)
closeDeleteActivityModal()
// - Hides modal and overlay
// - No deletion occurs

// Step 3: Execute deletion
confirmDeleteActivity()
// - Calls DELETE API
// - Shows loading indicator
// - Handles success/error
// - Navigates back
// - Resets state
```

---

## API Endpoint

```
DELETE /api/activities/:activityId
Authorization: Bearer <token>

Success (200):
{
  "message": "Activity deleted successfully",
  "files_deleted": 5
}

Errors:
- 401: Unauthorized
- 403: Not room creator
- 404: Activity not found
- 500: Server error
```

---

## State Variables

```javascript
editPageActivityId      // Current activity being edited
editPageActivityData    // Full activity data object
editPageFilesToRemove   // Array of files marked for removal
editPageReturnPath      // Hash path to return to after cancel/delete
```

---

## Modal IDs

```html
#delete-activity-modal  <!-- Confirmation modal -->
#modal-overlay          <!-- Shared overlay for all modals -->
```

---

## CSS Classes

```css
.btn-error              /* Red button for destructive actions */
.modal                  /* Modal container */
.modal-content          /* Modal content wrapper */
.modal-header           /* Modal header with title and close button */
.modal-body             /* Modal body content */
.modal-actions          /* Modal footer with action buttons */
.modal-overlay          /* Dark overlay behind modals */
```

---

## Database CASCADE

```sql
-- Submissions table has CASCADE deletion
FOREIGN KEY (activity_id) 
REFERENCES Activities(activity_id) 
ON DELETE CASCADE

-- When activity is deleted:
-- ✅ All submissions automatically deleted
-- ✅ No orphaned records
```

---

## Common Patterns

### Prevent Form Submission
```javascript
const myFunction = (event) => {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    // ... rest of function
};
```

### Show/Hide Modal
```javascript
// Show
document.getElementById('my-modal').style.display = 'block';
document.getElementById('modal-overlay').style.display = 'block';

// Hide
document.getElementById('my-modal').style.display = 'none';
document.getElementById('modal-overlay').style.display = 'none';
```

### Authenticated API Call
```javascript
const response = await fetch(`${API_BASE_URL}/endpoint`, {
    method: 'DELETE',
    headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
});
```

---

## Troubleshooting

### Issue: Button triggers form submission
**Fix:** Add `type="button"` to button element

### Issue: Modal doesn't appear
**Check:**
- Modal HTML exists in index.html
- Modal ID is correct
- CSS display property
- JavaScript errors in console

### Issue: Deletion fails with 403
**Cause:** User is not room creator
**Fix:** Verify user owns the class

### Issue: Files not deleted
**Check:**
- Backend console logs
- File paths in database
- Server file permissions

---

## Testing Quick Checks

```bash
# Check button types
grep -n "onclick=\"cancelEditActivity" Frontend/index.html
grep -n "onclick=\"deleteActivityConfirm" Frontend/index.html

# Check function definitions
grep -n "const cancelEditActivity" Frontend/js/classes.js
grep -n "const deleteActivityConfirm" Frontend/js/classes.js
grep -n "const confirmDeleteActivity" Frontend/js/classes.js

# Check modal HTML
grep -n "delete-activity-modal" Frontend/index.html

# Check database CASCADE
grep -n "ON DELETE CASCADE" Database/schema.sql
```

---

## Files to Check

```
Frontend/
  ├── index.html (lines 550-670)
  │   ├── Edit Activity page structure
  │   ├── Delete confirmation modal
  │   └── Button definitions
  │
  ├── js/classes.js (lines 2210-2320)
  │   ├── cancelEditActivity()
  │   ├── deleteActivityConfirm()
  │   ├── closeDeleteActivityModal()
  │   └── confirmDeleteActivity()
  │
  └── css/styles.css
      └── .btn-error style

Backend/
  └── Controllers/activityController.js
      └── deleteActivity() function

Database/
  └── schema.sql
      └── Submissions CASCADE constraint
```

---

## Documentation Files

1. **EDIT_PAGE_NAVIGATION_AND_DELETE_FIX.md** - Complete technical docs
2. **EDIT_PAGE_TESTING_GUIDE.md** - Comprehensive testing checklist
3. **CHANGELOG_TASK_9.md** - Summary of changes
4. **EDIT_PAGE_QUICK_REFERENCE.md** - This file

---

## One-Line Summary

**Navigation:** Added `type="button"` and event prevention to Back/Cancel buttons.  
**Deletion:** Implemented confirmation modal with three-step flow (button → modal → confirm).
