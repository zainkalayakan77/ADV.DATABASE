# Fix 500 Error - Quick Reference Card

## Problem
❌ **Error**: "Server Error fetching activity details" when clicking on activities

## Root Cause
Missing database columns:
- `Enrollments.is_archived`
- `Activities.is_accepting_submissions`

---

## Quick Fix (Choose One Method)

### Method 1: Automated Script (Recommended)

**Windows:**
```bash
fix_500_error.bat
```

**Linux/Mac:**
```bash
chmod +x fix_500_error.sh
./fix_500_error.sh
```

### Method 2: Direct SQL

```bash
mysql -u root -p student_tracker < Database/fix_500_error.sql
```

### Method 3: Manual Commands

```sql
USE student_tracker;

-- Add is_archived to Enrollments
ALTER TABLE Enrollments 
ADD COLUMN is_archived BOOLEAN DEFAULT FALSE 
AFTER status;

-- Add is_accepting_submissions to Activities
ALTER TABLE Activities 
ADD COLUMN is_accepting_submissions BOOLEAN DEFAULT TRUE 
AFTER deadline;

-- Set defaults
UPDATE Enrollments SET is_archived = FALSE WHERE is_archived IS NULL;
UPDATE Activities SET is_accepting_submissions = TRUE WHERE is_accepting_submissions IS NULL;
```

---

## Verify Fix

```sql
-- Check columns exist
DESCRIBE Enrollments;
DESCRIBE Activities;

-- Check data
SELECT enrollment_id, status, is_archived FROM Enrollments LIMIT 5;
SELECT activity_id, title, is_accepting_submissions FROM Activities LIMIT 5;
```

---

## After Fix

1. ✅ Restart backend server
2. ✅ Clear browser cache (Ctrl+Shift+Delete)
3. ✅ Refresh page (F5)
4. ✅ Click on activity - should work now!

---

## Still Not Working?

### Check Server Logs
```bash
cd Backend
node server.js
# Look for error messages
```

### Verify Columns
```sql
SELECT TABLE_NAME, COLUMN_NAME 
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'student_tracker'
AND COLUMN_NAME IN ('is_archived', 'is_accepting_submissions');
```

Should return 2 rows.

### Check MySQL Connection
```bash
mysql -u root -p
# If this fails, MySQL isn't running
```

---

## Files Created

| File | Purpose |
|------|---------|
| `Database/fix_500_error.sql` | SQL migration script |
| `fix_500_error.bat` | Windows automated fix |
| `fix_500_error.sh` | Linux/Mac automated fix |
| `FIX_500_ERROR_GUIDE.md` | Complete documentation |
| `FIX_500_ERROR_QUICK_REFERENCE.md` | This file |

---

## Expected Results

### Before Fix
```
❌ Click activity → 500 Server Error
❌ Console: "Unknown column 'is_accepting_submissions'"
❌ Activity details don't load
```

### After Fix
```
✅ Click activity → Activity details load
✅ No console errors
✅ Submission toggle works
✅ All features functional
```

---

## Time Required
⏱️ **5 minutes** (including verification)

## Difficulty
🟢 **Easy** - Just run one command

## Risk Level
🟢 **Low** - Only adds columns, doesn't modify existing data

---

## Support

**Full Documentation**: `FIX_500_ERROR_GUIDE.md`  
**Database Schema**: `Database/schema.sql`  
**Migration Script**: `Database/fix_500_error.sql`

---

**Last Updated**: May 4, 2026  
**Status**: ✅ Ready to apply
