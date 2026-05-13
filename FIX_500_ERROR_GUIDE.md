# Fix 500 Server Error - Complete Guide
## Resolving "Server Error fetching activity details"

**Issue**: Getting 500 error when clicking on activities  
**Root Cause**: Missing database columns that the backend code expects  
**Status**: ✅ Fix ready to apply

---

## Problem Summary

The backend code is trying to access two columns that don't exist in your database:

1. **`Activities.is_accepting_submissions`** - Controls submission toggle
2. **`Enrollments.is_archived`** - Personal archive status

When the SQL query tries to SELECT these columns, MySQL returns an error, causing the 500 server error.

---

## Quick Fix (5 Minutes)

### Step 1: Run the Fix Script

```bash
# Navigate to your project directory
cd /path/to/your/project

# Run the fix script
mysql -u root -p student_tracker < Database/fix_500_error.sql
```

**Enter your MySQL password when prompted.**

### Step 2: Verify the Fix

The script will automatically:
- ✅ Add `is_archived` column to Enrollments table
- ✅ Add `is_accepting_submissions` column to Activities table
- ✅ Set default values for existing records
- ✅ Display verification results

### Step 3: Test Your Application

1. Refresh your browser (F5)
2. Click on any activity
3. Activity details should now load without errors

---

## What the Fix Script Does

### For Enrollments Table

```sql
ALTER TABLE Enrollments 
ADD COLUMN is_archived BOOLEAN DEFAULT FALSE 
COMMENT 'Personal archive status for this enrollment' 
AFTER status;

UPDATE Enrollments 
SET is_archived = FALSE 
WHERE is_archived IS NULL;
```

**Result**: All enrollments will have `is_archived = FALSE` (not archived)

### For Activities Table

```sql
ALTER TABLE Activities 
ADD COLUMN is_accepting_submissions BOOLEAN DEFAULT TRUE 
COMMENT 'Controls whether students can submit work for this activity' 
AFTER deadline;

UPDATE Activities 
SET is_accepting_submissions = TRUE 
WHERE is_accepting_submissions IS NULL;
```

**Result**: All activities will have `is_accepting_submissions = TRUE` (accepting submissions)

---

## Manual Fix (If Script Fails)

If the automated script doesn't work, run these commands manually:

### Step 1: Connect to MySQL

```bash
mysql -u root -p
```

### Step 2: Select Database

```sql
USE student_tracker;
```

### Step 3: Add is_archived Column

```sql
ALTER TABLE Enrollments 
ADD COLUMN is_archived BOOLEAN DEFAULT FALSE 
COMMENT 'Personal archive status for this enrollment' 
AFTER status;

UPDATE Enrollments SET is_archived = FALSE WHERE is_archived IS NULL;
```

### Step 4: Add is_accepting_submissions Column

```sql
ALTER TABLE Activities 
ADD COLUMN is_accepting_submissions BOOLEAN DEFAULT TRUE 
COMMENT 'Controls whether students can submit work for this activity' 
AFTER deadline;

UPDATE Activities SET is_accepting_submissions = TRUE WHERE is_accepting_submissions IS NULL;
```

### Step 5: Verify

```sql
-- Check Enrollments
DESCRIBE Enrollments;

-- Check Activities
DESCRIBE Activities;

-- View sample data
SELECT enrollment_id, user_id, class_id, status, is_archived FROM Enrollments LIMIT 5;
SELECT activity_id, title, deadline, is_accepting_submissions FROM Activities LIMIT 5;
```

---

## Verification Checklist

After running the fix, verify these:

### ✅ Database Columns

```sql
-- Should show is_archived column
DESCRIBE Enrollments;

-- Should show is_accepting_submissions column
DESCRIBE Activities;
```

**Expected Output for Enrollments:**
```
+---------------+----------------------------------+------+-----+---------+
| Field         | Type                             | Null | Key | Default |
+---------------+----------------------------------+------+-----+---------+
| ...           | ...                              | ...  | ... | ...     |
| status        | enum('Active','Kicked','Pending')| YES  |     | Active  |
| is_archived   | tinyint(1)                       | YES  |     | 0       |
| enrolled_at   | timestamp                        | YES  |     | ...     |
+---------------+----------------------------------+------+-----+---------+
```

**Expected Output for Activities:**
```
+---------------------------+---------------+------+-----+---------+
| Field                     | Type          | Null | Key | Default |
+---------------------------+---------------+------+-----+---------+
| ...                       | ...           | ...  | ... | ...     |
| deadline                  | datetime      | YES  |     | NULL    |
| is_accepting_submissions  | tinyint(1)    | YES  |     | 1       |
| attachment_path           | varchar(500)  | YES  |     | NULL    |
+---------------------------+---------------+------+-----+---------+
```

### ✅ Backend Server

1. **Restart your backend server** (if it was running):
```bash
cd Backend
node server.js
```

2. **Check for errors** in the console output

### ✅ Frontend Application

1. **Clear browser cache** (Ctrl+Shift+Delete)
2. **Refresh the page** (F5)
3. **Click on an activity**
4. **Verify activity details load** without errors

---

## Troubleshooting

### Error: "Column already exists"

**Cause**: The column was already added  
**Solution**: This is fine! The script checks before adding. Continue to next step.

### Error: "Access denied"

**Cause**: MySQL user doesn't have ALTER permissions  
**Solution**: 
```bash
# Login as root
mysql -u root -p

# Grant permissions
GRANT ALTER ON student_tracker.* TO 'your_user'@'localhost';
FLUSH PRIVILEGES;
```

### Error: "Unknown database 'student_tracker'"

**Cause**: Database doesn't exist or wrong name  
**Solution**: 
```sql
-- Check database name
SHOW DATABASES;

-- If different name, use it
USE your_actual_database_name;
```

### Still Getting 500 Error

**Check server logs:**
```bash
# In Backend directory
node server.js
```

**Look for error messages like:**
- `Unknown column 'is_accepting_submissions'` → Column not added
- `Unknown column 'is_archived'` → Column not added
- Other SQL errors → Check query syntax

**Verify columns exist:**
```sql
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    COLUMN_TYPE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'student_tracker'
AND COLUMN_NAME IN ('is_archived', 'is_accepting_submissions');
```

Should return 2 rows (one for each column).

---

## Understanding the Error

### What Happened?

1. **Backend code was updated** to use new features (submission toggle, personal archive)
2. **Database schema wasn't updated** to include the new columns
3. **SQL query failed** when trying to SELECT non-existent columns
4. **Server returned 500 error** instead of activity details

### The SQL Query That Failed

```sql
SELECT a.activity_id, a.class_id, a.title, a.description, a.deadline, 
       a.is_accepting_submissions,  -- ❌ This column didn't exist
       a.attachment_path, a.created_at, a.created_by,
       u.name as created_by_name,
       c.class_name, c.status as class_status,
       e.role as user_role, 
       e.is_archived as personal_archive  -- ❌ This column didn't exist
FROM Activities a
JOIN Users u ON a.created_by = u.user_id
JOIN Classes c ON a.class_id = c.class_id
JOIN Enrollments e ON c.class_id = e.class_id AND e.user_id = ?
WHERE a.activity_id = ? AND e.status = 'Active'
```

**MySQL Error**: `Unknown column 'a.is_accepting_submissions' in 'field list'`

### Why It Wasn't Caught Earlier

- Code was updated but database migration wasn't run
- Development and production databases out of sync
- Migration file existed but wasn't executed

---

## Prevention for Future

### Always Run Migrations

When updating code that changes database structure:

1. **Check for migration files** in `Database/` folder
2. **Run migrations** before testing new features
3. **Verify columns exist** before deploying

### Migration Checklist

```bash
# 1. Check for new migration files
ls -la Database/*.sql

# 2. Run each migration
mysql -u root -p student_tracker < Database/migration_file.sql

# 3. Verify changes
mysql -u root -p student_tracker -e "DESCRIBE table_name;"
```

### Keep Schema Updated

- ✅ Update `Database/schema.sql` when adding columns
- ✅ Create migration files for existing databases
- ✅ Document schema changes in README
- ✅ Test migrations before deploying

---

## Files Modified

### Database Files

1. **`Database/schema.sql`** - Updated with new columns (for fresh installs)
2. **`Database/fix_500_error.sql`** - Migration script (for existing databases)
3. **`Database/add_submission_toggle.sql`** - Original migration (partial)

### What Each File Does

| File | Purpose | When to Use |
|------|---------|-------------|
| `schema.sql` | Complete database schema | Fresh installation |
| `fix_500_error.sql` | Add missing columns | Existing database (USE THIS) |
| `add_submission_toggle.sql` | Partial migration | Superseded by fix_500_error.sql |

---

## After Applying the Fix

### Expected Behavior

**Teachers can:**
- ✅ Create activities with submission toggle
- ✅ Edit activities and change toggle state
- ✅ View activity details without errors
- ✅ Archive classes (personal archive)

**Students can:**
- ✅ View activity details without errors
- ✅ See submission form when toggle is ON
- ✅ See "closed" message when toggle is OFF
- ✅ Submit work when allowed

### Test These Scenarios

1. **View Activity** (should work now)
   - Login as student
   - Click on any activity
   - Activity details should load

2. **Create Activity with Toggle**
   - Login as teacher
   - Create new activity
   - Toggle should be visible and functional

3. **Submit Work**
   - Login as student
   - Open activity with toggle ON
   - Submit work successfully

4. **Toggle OFF**
   - Login as teacher
   - Edit activity, turn toggle OFF
   - Student should see "closed" message

---

## Summary

### Problem
- ❌ 500 error when viewing activities
- ❌ Missing database columns

### Solution
- ✅ Run `Database/fix_500_error.sql`
- ✅ Adds 2 missing columns
- ✅ Sets default values

### Result
- ✅ Activities load without errors
- ✅ Submission toggle works
- ✅ Personal archive works
- ✅ All features functional

---

## Quick Command Reference

```bash
# Run the fix
mysql -u root -p student_tracker < Database/fix_500_error.sql

# Verify columns exist
mysql -u root -p student_tracker -e "DESCRIBE Enrollments;"
mysql -u root -p student_tracker -e "DESCRIBE Activities;"

# Check sample data
mysql -u root -p student_tracker -e "SELECT * FROM Activities LIMIT 5;"

# Restart backend server
cd Backend
node server.js
```

---

**Status**: ✅ Fix ready to apply  
**Estimated Time**: 5 minutes  
**Difficulty**: Easy  
**Risk**: Low (only adds columns, doesn't modify existing data)

