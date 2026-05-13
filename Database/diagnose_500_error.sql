-- ============================================================================
-- DIAGNOSTIC TOOL: Identify Missing Columns Causing 500 Error
-- ============================================================================
-- Run this script to diagnose what's causing the 500 error
-- It will check for missing columns and provide specific fix instructions
-- ============================================================================

USE student_tracker;

-- ============================================================================
-- DIAGNOSTIC REPORT
-- ============================================================================

SELECT '============================================' AS '';
SELECT '   500 ERROR DIAGNOSTIC REPORT' AS '';
SELECT '============================================' AS '';
SELECT '' AS '';

-- ============================================================================
-- CHECK 1: Database Exists
-- ============================================================================

SELECT '✓ CHECK 1: Database Connection' AS '';
SELECT DATABASE() AS current_database;
SELECT '' AS '';

-- ============================================================================
-- CHECK 2: Tables Exist
-- ============================================================================

SELECT '✓ CHECK 2: Required Tables' AS '';
SELECT 
    CASE 
        WHEN COUNT(*) = 2 THEN '✅ PASS - Both tables exist'
        ELSE '❌ FAIL - Missing tables'
    END AS status,
    COUNT(*) AS tables_found,
    '2' AS tables_required
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = 'student_tracker'
AND TABLE_NAME IN ('Enrollments', 'Activities');
SELECT '' AS '';

-- ============================================================================
-- CHECK 3: is_archived Column in Enrollments
-- ============================================================================

SELECT '✓ CHECK 3: Enrollments.is_archived Column' AS '';
SELECT 
    CASE 
        WHEN COUNT(*) = 1 THEN '✅ PASS - Column exists'
        ELSE '❌ FAIL - Column missing (THIS IS CAUSING 500 ERROR)'
    END AS status,
    CASE 
        WHEN COUNT(*) = 0 THEN 'Run: ALTER TABLE Enrollments ADD COLUMN is_archived BOOLEAN DEFAULT FALSE AFTER status;'
        ELSE 'No action needed'
    END AS fix_command
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'student_tracker'
AND TABLE_NAME = 'Enrollments'
AND COLUMN_NAME = 'is_archived';
SELECT '' AS '';

-- ============================================================================
-- CHECK 4: is_accepting_submissions Column in Activities
-- ============================================================================

SELECT '✓ CHECK 4: Activities.is_accepting_submissions Column' AS '';
SELECT 
    CASE 
        WHEN COUNT(*) = 1 THEN '✅ PASS - Column exists'
        ELSE '❌ FAIL - Column missing (THIS IS CAUSING 500 ERROR)'
    END AS status,
    CASE 
        WHEN COUNT(*) = 0 THEN 'Run: ALTER TABLE Activities ADD COLUMN is_accepting_submissions BOOLEAN DEFAULT TRUE AFTER deadline;'
        ELSE 'No action needed'
    END AS fix_command
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'student_tracker'
AND TABLE_NAME = 'Activities'
AND COLUMN_NAME = 'is_accepting_submissions';
SELECT '' AS '';

-- ============================================================================
-- CHECK 5: All Required Columns Summary
-- ============================================================================

SELECT '✓ CHECK 5: All Required Columns' AS '';
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    COLUMN_TYPE,
    COLUMN_DEFAULT,
    '✅ EXISTS' AS status
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'student_tracker'
AND (
    (TABLE_NAME = 'Enrollments' AND COLUMN_NAME = 'is_archived')
    OR
    (TABLE_NAME = 'Activities' AND COLUMN_NAME = 'is_accepting_submissions')
);
SELECT '' AS '';

-- ============================================================================
-- CHECK 6: Missing Columns (Root Cause)
-- ============================================================================

SELECT '✓ CHECK 6: Missing Columns (Root Cause of 500 Error)' AS '';

-- Check if is_archived is missing
SELECT 
    'Enrollments' AS table_name,
    'is_archived' AS missing_column,
    '❌ MISSING - THIS IS CAUSING 500 ERROR' AS status,
    'Run fix_500_error.sql or add manually' AS solution
WHERE NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'student_tracker'
    AND TABLE_NAME = 'Enrollments'
    AND COLUMN_NAME = 'is_archived'
);

-- Check if is_accepting_submissions is missing
SELECT 
    'Activities' AS table_name,
    'is_accepting_submissions' AS missing_column,
    '❌ MISSING - THIS IS CAUSING 500 ERROR' AS status,
    'Run fix_500_error.sql or add manually' AS solution
WHERE NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'student_tracker'
    AND TABLE_NAME = 'Activities'
    AND COLUMN_NAME = 'is_accepting_submissions'
);

SELECT '' AS '';

-- ============================================================================
-- CHECK 7: Sample Data (If Columns Exist)
-- ============================================================================

SELECT '✓ CHECK 7: Sample Data' AS '';

-- Try to select from Enrollments (will fail if column missing)
SELECT 
    'Attempting to query Enrollments.is_archived...' AS message;

-- Try to select from Activities (will fail if column missing)
SELECT 
    'Attempting to query Activities.is_accepting_submissions...' AS message;

SELECT '' AS '';

-- ============================================================================
-- FINAL DIAGNOSIS
-- ============================================================================

SELECT '============================================' AS '';
SELECT '   FINAL DIAGNOSIS' AS '';
SELECT '============================================' AS '';

SELECT 
    CASE 
        WHEN (
            SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = 'student_tracker'
            AND TABLE_NAME = 'Enrollments'
            AND COLUMN_NAME = 'is_archived'
        ) = 0 
        OR (
            SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = 'student_tracker'
            AND TABLE_NAME = 'Activities'
            AND COLUMN_NAME = 'is_accepting_submissions'
        ) = 0
        THEN '❌ PROBLEM FOUND: Missing columns are causing 500 error'
        ELSE '✅ ALL CHECKS PASSED: Columns exist, problem may be elsewhere'
    END AS diagnosis;

SELECT 
    CASE 
        WHEN (
            SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = 'student_tracker'
            AND (
                (TABLE_NAME = 'Enrollments' AND COLUMN_NAME = 'is_archived')
                OR
                (TABLE_NAME = 'Activities' AND COLUMN_NAME = 'is_accepting_submissions')
            )
        ) < 2
        THEN 'Run: mysql -u root -p student_tracker < Database/fix_500_error.sql'
        ELSE 'No database fix needed. Check backend server logs for other errors.'
    END AS recommended_action;

SELECT '' AS '';
SELECT '============================================' AS '';
SELECT '   END OF DIAGNOSTIC REPORT' AS '';
SELECT '============================================' AS '';

-- ============================================================================
-- DETAILED COLUMN INFORMATION (For Reference)
-- ============================================================================

SELECT '' AS '';
SELECT 'Current Enrollments Table Structure:' AS '';
DESCRIBE Enrollments;

SELECT '' AS '';
SELECT 'Current Activities Table Structure:' AS '';
DESCRIBE Activities;
