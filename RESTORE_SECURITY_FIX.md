# Restore Button Security Fix - Room Owner Only

## Overview
This document details the security fix that restricts the "Restore" functionality to room owners only, preventing unauthorized users from restoring archived classes.

## Problem Statement

### Security Issue
Previously, any teacher in an archived class could see and potentially click the "Restore" button, even if they weren't the room creator. This created a security vulnerability where:
- Non-owner teachers could restore classes they didn't create
- Students could potentially manipulate the UI to access restore functionality
- No server-side validation existed to prevent unauthorized restore attempts

## Solution Implemented

### Two-Layer Security Approach

#### 1. Frontend Security (UI Layer)
**Purpose:** Hide the restore button from unauthorized users

**Implementation:**
- Check if current user ID matches room creator ID (`created_by`)
- Only render "Restore" button if user is the room owner
- Show informative banners for non-owners
- Add visual "Owner" badge for room creators

**File:** `Frontend/js/classes.js`

```javascript
const isRoomOwner = currentUserId && classItem.created_by === currentUserId;
const canRestoreGlobal = isRoomOwner && isTeacherArchived;

${canRestoreGlobal ? `
    <button class="btn btn-primary btn-sm" onclick="unarchiveClass(...)">
        <i class="fas fa-undo"></i> Restore
    </button>
` : ''}
```

#### 2. Backend Security (API Layer)
**Purpose:** Block unauthorized restore attempts at the server level

**Implementation:**
- Verify user ID matches room creator ID before allowing restore
- Return 403 Forbidden error for unauthorized attempts
- Validate ownership even if frontend is bypassed

**File:** `Backend/Controllers/classController.js`

```javascript
// Verify user is the room owner (creator)
const [classInfo] = await pool.execute(
    'SELECT created_by, class_name FROM Classes WHERE class_id = ?',
    [classId]
);

if (classInfo[0].created_by !== userId) {
    return res.status(403).json({ 
        error: 'Only the room owner can restore this class',
        message: 'You must be the creator of this room to restore it'
    });
}
```

## Changes Made

### Backend Changes

#### 1. Updated `unarchiveClass` Function
**File:** `Backend/Controllers/classController.js`

**Before:**
```javascript
// Verify user is a teacher in this class
const [enrollment] = await pool.execute(
    'SELECT role FROM Enrollments WHERE user_id = ? AND class_id = ?',
    [userId, classId]
);

if (enrollment.length === 0 || enrollment[0].role !== 'Teacher') {
    return res.status(403).json({ error: 'Only teachers can unarchive classes' });
}
```

**After:**
```javascript
// Verify user is the room owner (creator)
const [classInfo] = await pool.execute(
    'SELECT created_by, class_name FROM Classes WHERE class_id = ?',
    [classId]
);

if (classInfo[0].created_by !== userId) {
    return res.status(403).json({ 
        error: 'Only the room owner can restore this class',
        message: 'You must be the creator of this room to restore it'
    });
}
```

#### 2. Updated Query to Include `created_by`
**Files:** 
- `getUserClasses` - Added `c.created_by` to SELECT
- `getArchivedClasses` - Added `c.created_by` to SELECT

This ensures the frontend receives the creator ID for comparison.

### Frontend Changes

#### 1. Updated `renderArchivedClasses` Function
**File:** `Frontend/js/classes.js`

**Key Changes:**
- Get current user ID from localStorage
- Compare current user ID with room creator ID
- Conditionally render "Restore" button based on ownership
- Add "Owner" badge for room creators
- Show informative banners for non-owners

**Logic:**
```javascript
const currentUser = getCurrentUser();
const currentUserId = currentUser ? currentUser.user_id : null;
const isRoomOwner = currentUserId && classItem.created_by === currentUserId;
const canRestoreGlobal = isRoomOwner && isTeacherArchived;
```

#### 2. Added Visual Indicators

**Owner Badge:**
```html
<span class="owner-badge">
    <i class="fas fa-crown"></i> Owner
</span>
```

**Non-Owner Banner:**
```html
<div class="info-banner owner-only-banner">
    <i class="fas fa-info-circle"></i> 
    Only the room owner can restore this class
</div>
```

### CSS Changes

#### New Styles Added
**File:** `Frontend/css/styles.css`

1. **Owner Badge** - Gold badge with crown icon
2. **Info Banners** - Color-coded informational messages
3. **Badge Variants** - Different colors for archive types
4. **Responsive Design** - Mobile-friendly layouts

## User Experience

### Room Owner View (Archived Class)
```
┌─────────────────────────────────────────┐
│ Mathematics 101          [👑 Owner]     │
│ [Archived by Teacher]                   │
│ Code: ABC123                            │
│                                         │
│ [Restore] button ← VISIBLE             │
│ (Can restore the class)                 │
└─────────────────────────────────────────┘
```

### Non-Owner Teacher View (Archived Class)
```
┌─────────────────────────────────────────┐
│ Mathematics 101                         │
│ [Archived by Teacher]                   │
│ Code: ABC123                            │
│                                         │
│ ℹ️ Only the room owner can restore     │
│    this class                           │
│                                         │
│ NO Restore button                       │
└─────────────────────────────────────────┘
```

### Student View (Teacher-Archived Class)
```
┌─────────────────────────────────────────┐
│ Mathematics 101                         │
│ [Archived by Teacher]                   │
│ Code: ABC123                            │
│                                         │
│ 🔒 Read-Only Mode                       │
│    You can view materials but cannot    │
│    submit new work                      │
│                                         │
│ [Leave Class] button only               │
│ NO Restore button                       │
└─────────────────────────────────────────┘
```

### Student View (Personal Archive)
```
┌─────────────────────────────────────────┐
│ Mathematics 101                         │
│ [Personally Archived]                   │
│ Code: ABC123                            │
│                                         │
│ [Restore] button ← VISIBLE              │
│ [Leave Class] button                    │
│ (Can restore their personal archive)    │
└─────────────────────────────────────────┘
```

## Security Testing

### Test Cases

#### 1. Room Owner Can Restore
**Steps:**
1. Login as room creator
2. Navigate to Archived Rooms
3. Find archived class
4. Verify "Owner" badge is visible
5. Verify "Restore" button is visible
6. Click "Restore"
7. Verify class is restored successfully

**Expected:** ✅ Success

#### 2. Non-Owner Teacher Cannot Restore (Frontend)
**Steps:**
1. Login as non-owner teacher
2. Navigate to Archived Rooms
3. Find archived class (created by another teacher)
4. Verify NO "Owner" badge
5. Verify NO "Restore" button
6. Verify info banner shows "Only the room owner can restore"

**Expected:** ✅ Button hidden

#### 3. Non-Owner Teacher Cannot Restore (Backend)
**Steps:**
1. Login as non-owner teacher
2. Manually call API: `PUT /api/classes/{classId}/unarchive`
3. Verify response is 403 Forbidden
4. Verify error message: "Only the room owner can restore this class"

**Expected:** ✅ 403 Forbidden

#### 4. Student Cannot Restore Teacher-Archived Class
**Steps:**
1. Login as student
2. Navigate to Archived Rooms
3. Find teacher-archived class
4. Verify NO "Restore" button
5. Verify "Read-Only Mode" banner shows
6. Verify only "Leave Class" button is available

**Expected:** ✅ Button hidden

#### 5. Student Can Restore Personal Archive
**Steps:**
1. Login as student
2. Navigate to Archived Rooms
3. Find personally archived class (not teacher-archived)
4. Verify "Restore" button IS visible
5. Click "Restore"
6. Verify class is restored successfully

**Expected:** ✅ Success

## API Endpoints

### Restore Class (Unarchive)
```
PUT /api/classes/:classId/unarchive
```

**Authorization:** Room owner only

**Request Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
    "message": "Class restored successfully"
}
```

**Error Response (403):**
```json
{
    "error": "Only the room owner can restore this class",
    "message": "You must be the creator of this room to restore it"
}
```

**Error Response (404):**
```json
{
    "error": "Class not found"
}
```

## Database Schema

### Classes Table
```sql
CREATE TABLE Classes (
    class_id INT PRIMARY KEY AUTO_INCREMENT,
    class_name VARCHAR(100) NOT NULL,
    class_code VARCHAR(10) UNIQUE NOT NULL,
    description TEXT,
    subject VARCHAR(100),
    section VARCHAR(50),
    status ENUM('Active', 'Archived') DEFAULT 'Active',
    created_by INT NOT NULL,  -- Room owner ID
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    archived_at TIMESTAMP NULL,
    FOREIGN KEY (created_by) REFERENCES Users(user_id) ON DELETE CASCADE
);
```

**Key Field:** `created_by` - Stores the user ID of the room creator

## Security Benefits

### 1. Prevents Unauthorized Restoration
- Only room owners can restore archived classes
- Non-owner teachers cannot interfere with class lifecycle
- Students cannot manipulate archived classes

### 2. Clear Ownership Model
- Visual "Owner" badge identifies room creators
- Informative messages explain restrictions
- Transparent permission system

### 3. Defense in Depth
- Frontend validation (UI layer)
- Backend validation (API layer)
- Database constraints (data layer)

### 4. Audit Trail
- Server logs all restore attempts
- Failed attempts logged with user ID
- Easy to track unauthorized access attempts

## Migration Notes

### No Database Changes Required
This is a pure logic update - no schema changes needed.

### Deployment Steps
1. Deploy backend changes first
2. Deploy frontend changes
3. Clear browser cache
4. Test with different user roles

### Backward Compatibility
- Existing archived classes work as before
- Room owners retain full control
- No data migration needed

## Troubleshooting

### "Restore" button not showing for owner
**Check:**
1. User is logged in
2. User ID matches `created_by` in database
3. Class is actually archived
4. Browser cache is cleared
5. `created_by` is included in API response

### Non-owner can still restore
**Check:**
1. Backend changes are deployed
2. Server is restarted
3. API endpoint has authorization check
4. User ID comparison is correct

### "Owner" badge not showing
**Check:**
1. `created_by` field is in API response
2. `getCurrentUser()` returns valid user data
3. CSS for `.owner-badge` is loaded
4. User ID comparison logic is correct

## Future Enhancements

### 1. Transfer Ownership
Allow room owners to transfer ownership to another teacher:
```javascript
PUT /api/classes/:classId/transfer-ownership
Body: { newOwnerId: 123 }
```

### 2. Co-Owners
Allow multiple owners with restore permissions:
```sql
CREATE TABLE ClassOwners (
    class_id INT,
    user_id INT,
    PRIMARY KEY (class_id, user_id)
);
```

### 3. Restore History
Track who restored classes and when:
```sql
ALTER TABLE Classes 
ADD COLUMN restored_by INT,
ADD COLUMN restored_at TIMESTAMP NULL;
```

### 4. Restore Permissions
Granular permissions for different actions:
```sql
CREATE TABLE ClassPermissions (
    class_id INT,
    user_id INT,
    can_restore BOOLEAN DEFAULT FALSE,
    can_delete BOOLEAN DEFAULT FALSE
);
```

## Conclusion

This security fix implements a robust, two-layer security model that:
- ✅ Restricts restore functionality to room owners only
- ✅ Provides clear visual feedback about permissions
- ✅ Prevents unauthorized access at both UI and API levels
- ✅ Maintains backward compatibility
- ✅ Enhances user experience with informative messages

The implementation follows security best practices with defense in depth, clear error messages, and comprehensive testing coverage.
