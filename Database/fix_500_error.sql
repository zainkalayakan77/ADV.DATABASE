-- ============================================================================
-- FIX 500 ERROR: Add Missing Columns to Database
-- ============================================================================
-- This script fixes the "Server Error fetching activity details" issue
-- Run this script to add the missing columns to your existing database
-- ============================================================================

USE student_tracker;

-- ============================================================================
-- STEP 1: Add is_archived column to Enrollments table
-- ============================================================================

-- Check if is_archived column exists in Enrollments
SET @column_exists_enrollments = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'student_tracker'
    AND TABLE_NAME = 'Enrollments'
    AND COLUMN_NAME = 'is_archived'
);

-- Add is_archived column if it doesn't exist
SET @sql_enrollments = IF(
    @column_exists_enrollments = 0,
    'ALTER TABLE Enrollments ADD COLUMN is_archived BOOLEAN DEFAULT FALSE COMMENT "Personal archive status for this enrollment" AFTER status',
    'SELECT "Column is_archived already exists in Enrollments" AS message'
);

PREPARE stmt FROM @sql_enrollments;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Update existing enrollments to not be archived by default
UPDATE Enrollments 
SET is_archived = FALSE 
WHERE is_archived IS NULL;

-- ============================================================================
-- STEP 2: Add is_accepting_submissions column to Activities table
-- ============================================================================

-- Check if is_accepting_submissions column exists in Activities
SET @column_exists_activities = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'student_tracker'
    AND TABLE_NAME = 'Activities'
    AND COLUMN_NAME = 'is_accepting_submissions'
);

-- Add is_accepting_submissions column if it doesn't exist
SET @sql_activities = IF(
    @column_exists_activities = 0,
    'ALTER TABLE Activities ADD COLUMN is_accepting_submissions BOOLEAN DEFAULT TRUE COMMENT "Controls whether students can submit work for this activity" AFTER deadline',
    'SELECT "Column is_accepting_submissions already exists in Activities" AS message'
);

PREPARE stmt FROM @sql_activities;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Update existing activities to accept submissions by default
UPDATE Activities 
SET is_accepting_submissions = TRUE 
WHERE is_accepting_submissions IS NULL;

-- ============================================================================
-- VERIFICATION: Check that columns were added successfully
-- ============================================================================

-- Verify Enrollments table
SELECT 
    '✅ Enrollments Table' AS table_name,
    COLUMN_NAME,
    COLUMN_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'student_tracker'
AND TABLE_NAME = 'Enrollments'
AND COLUMN_NAME = 'is_archived';

-- Verify Activities table
SELECT 
    '✅ Activities Table' AS table_name,
    COLUMN_NAME,
    COLUMN_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'student_tracker'
AND TABLE_NAME = 'Activities'
AND COLUMN_NAME = 'is_accepting_submissions';

-- Show sample data from Enrollments
SELECT 
    enrollment_id,
    user_id,
    class_id,
    role,
    status,
    is_archived
FROM Enrollments
LIMIT 5;

-- Show sample data from Activities
SELECT 
    activity_id,
    title,
    deadline,
    is_accepting_submissions,
    created_at
FROM Activities
LIMIT 5;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

SELECT 
    '✅ Migration completed successfully!' AS status,
    'Both missing columns have been added:' AS message,
    '1. Enrollments.is_archived (BOOLEAN, DEFAULT FALSE)' AS column_1,
    '2. Activities.is_accepting_submissions (BOOLEAN, DEFAULT TRUE)' AS column_2,
    'Your application should now work without 500 errors!' AS note;
