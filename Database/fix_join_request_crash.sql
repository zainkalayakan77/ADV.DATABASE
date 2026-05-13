-- Fix Join Request Backend Crash
-- This script ensures the database schema is correct and handles edge cases

USE student_tracker;

-- 1. Verify and fix Enrollments table structure
-- Check if the table exists and has the correct columns
DESCRIBE Enrollments;

-- 2. Add missing columns if they don't exist (safe to run multiple times)
ALTER TABLE Enrollments 
ADD COLUMN IF NOT EXISTS status ENUM('Active', 'Kicked', 'Pending') DEFAULT 'Active' AFTER role;

ALTER TABLE Enrollments 
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE COMMENT 'Personal archive status for this enrollment' AFTER status;

ALTER TABLE Enrollments 
ADD COLUMN IF NOT EXISTS kicked_at TIMESTAMP NULL AFTER enrolled_at;

ALTER TABLE Enrollments 
ADD COLUMN IF NOT EXISTS kicked_by INT NULL AFTER kicked_at;

-- 3. Ensure foreign key constraints exist
-- Drop existing constraint if it exists (to recreate it properly)
ALTER TABLE Enrollments DROP FOREIGN KEY IF EXISTS enrollments_kicked_by_fk;

-- Add the foreign key constraint
ALTER TABLE Enrollments 
ADD CONSTRAINT enrollments_kicked_by_fk 
FOREIGN KEY (kicked_by) REFERENCES Users(user_id) ON DELETE SET NULL;

-- 4. Ensure unique constraint exists (prevents duplicate enrollments)
-- Check if the constraint exists
SELECT CONSTRAINT_NAME 
FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
WHERE TABLE_SCHEMA = 'student_tracker' 
  AND TABLE_NAME = 'Enrollments' 
  AND CONSTRAINT_TYPE = 'UNIQUE';

-- If the unique constraint doesn't exist, add it
-- First, remove any duplicate entries (keep the most recent one)
DELETE e1 FROM Enrollments e1
INNER JOIN Enrollments e2 
WHERE e1.user_id = e2.user_id 
  AND e1.class_id = e2.class_id 
  AND e1.enrollment_id < e2.enrollment_id;

-- Now add the unique constraint
ALTER TABLE Enrollments 
ADD UNIQUE KEY IF NOT EXISTS unique_enrollment (user_id, class_id);

-- 5. Verify Classes table has status column
ALTER TABLE Classes 
ADD COLUMN IF NOT EXISTS status ENUM('Active', 'Archived') DEFAULT 'Active' AFTER section;

ALTER TABLE Classes 
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP NULL AFTER updated_at;

-- 6. Ensure JoinRequests table exists and is properly structured
CREATE TABLE IF NOT EXISTS JoinRequests (
    request_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    class_id INT NOT NULL,
    message TEXT,
    status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP NULL,
    reviewed_by INT NULL,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES Classes(class_id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES Users(user_id) ON DELETE SET NULL,
    UNIQUE KEY unique_user_class_request (user_id, class_id)
);

-- 7. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_enrollments_user_class ON Enrollments(user_id, class_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON Enrollments(status);
CREATE INDEX IF NOT EXISTS idx_classes_code ON Classes(class_code);
CREATE INDEX IF NOT EXISTS idx_classes_status ON Classes(status);
CREATE INDEX IF NOT EXISTS idx_join_requests_status ON JoinRequests(status);

-- 8. Clean up any orphaned or invalid data
-- Remove enrollments for non-existent users
DELETE FROM Enrollments 
WHERE user_id NOT IN (SELECT user_id FROM Users);

-- Remove enrollments for non-existent classes
DELETE FROM Enrollments 
WHERE class_id NOT IN (SELECT class_id FROM Classes);

-- 9. Verify data integrity
-- Check for any NULL values in required fields
SELECT 'Enrollments with NULL user_id' as issue, COUNT(*) as count 
FROM Enrollments WHERE user_id IS NULL
UNION ALL
SELECT 'Enrollments with NULL class_id', COUNT(*) 
FROM Enrollments WHERE class_id IS NULL
UNION ALL
SELECT 'Enrollments with NULL role', COUNT(*) 
FROM Enrollments WHERE role IS NULL
UNION ALL
SELECT 'Classes with NULL class_code', COUNT(*) 
FROM Classes WHERE class_code IS NULL;

-- 10. Display current enrollment statistics
SELECT 
    'Total Enrollments' as metric,
    COUNT(*) as count
FROM Enrollments
UNION ALL
SELECT 
    'Active Enrollments',
    COUNT(*)
FROM Enrollments WHERE status = 'Active'
UNION ALL
SELECT 
    'Kicked Enrollments',
    COUNT(*)
FROM Enrollments WHERE status = 'Kicked'
UNION ALL
SELECT 
    'Pending Enrollments',
    COUNT(*)
FROM Enrollments WHERE status = 'Pending';

-- Success message
SELECT 'Database schema verification and fixes completed successfully!' as status;
