-- Add personal archive column to Enrollments table for student-specific archiving
ALTER TABLE Enrollments 
ADD COLUMN is_archived BOOLEAN DEFAULT FALSE AFTER status,
ADD COLUMN archived_at TIMESTAMP NULL AFTER is_archived;

-- This allows students to archive classes on their side without affecting the teacher's view
-- Teachers use the Classes.status field for global archiving
