-- Add submission toggle column to Activities table
-- This allows teachers to control when students can submit work

ALTER TABLE Activities 
ADD COLUMN is_accepting_submissions BOOLEAN DEFAULT TRUE AFTER deadline;

-- Add comment for documentation
ALTER TABLE Activities 
MODIFY COLUMN is_accepting_submissions BOOLEAN DEFAULT TRUE 
COMMENT 'Controls whether students can submit work for this activity';

-- Update existing activities to accept submissions by default
UPDATE Activities 
SET is_accepting_submissions = TRUE 
WHERE is_accepting_submissions IS NULL;
