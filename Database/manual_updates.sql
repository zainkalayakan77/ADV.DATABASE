-- Manual Database Updates - Run these commands one by one
-- Connect to MySQL first: mysql -u root -p

USE student_tracker;

-- 1. Add teacher_notes and grading_note columns to Activities table
ALTER TABLE Activities ADD COLUMN IF NOT EXISTS teacher_notes TEXT AFTER attachment_path;
ALTER TABLE Activities ADD COLUMN IF NOT EXISTS grading_note TEXT AFTER teacher_notes;
ALTER TABLE Activities ADD COLUMN IF NOT EXISTS max_score DECIMAL(5,2) DEFAULT 100.00 AFTER grading_note;

-- 2. Add status, subject, section, and archived_at columns to Classes table
ALTER TABLE Classes ADD COLUMN IF NOT EXISTS subject VARCHAR(100) AFTER description;
ALTER TABLE Classes ADD COLUMN IF NOT EXISTS section VARCHAR(50) AFTER subject;
ALTER TABLE Classes ADD COLUMN IF NOT EXISTS status ENUM('Active', 'Archived') DEFAULT 'Active' AFTER section;
ALTER TABLE Classes ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP NULL AFTER updated_at;

-- 2. Add status and kick-related columns to Enrollments table (if not exists)
ALTER TABLE Enrollments ADD COLUMN IF NOT EXISTS status ENUM('Active', 'Kicked', 'Pending') DEFAULT 'Active' AFTER role;
ALTER TABLE Enrollments ADD COLUMN IF NOT EXISTS kicked_at TIMESTAMP NULL AFTER enrolled_at;
ALTER TABLE Enrollments ADD COLUMN IF NOT EXISTS kicked_by INT NULL AFTER kicked_at;

-- 3. Add foreign key for kicked_by (if not exists)
-- Note: This might fail if the constraint already exists, that's okay
ALTER TABLE Enrollments ADD FOREIGN KEY (kicked_by) REFERENCES Users(user_id) ON DELETE SET NULL;

-- 4. Create JoinRequests table (if not exists)
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

-- 5. Create Notifications table (if not exists)
CREATE TABLE IF NOT EXISTS Notifications (
    notification_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    type ENUM('join_request', 'new_submission', 'system') NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    related_id INT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

-- 6. Create indexes for better performance (if not exists)
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON Enrollments(status);
CREATE INDEX IF NOT EXISTS idx_classes_status ON Classes(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON Notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_join_requests_status ON JoinRequests(status);

-- 7. Update existing enrollments and classes to have default statuses
UPDATE Enrollments SET status = 'Active' WHERE status IS NULL;
UPDATE Classes SET status = 'Active' WHERE status IS NULL;

-- 8. Fix JoinRequests unique constraint
ALTER TABLE JoinRequests DROP INDEX IF EXISTS unique_pending_request;

-- Verify the updates
SELECT 'Tables created successfully' as Status;
SHOW TABLES;
DESCRIBE Enrollments;
DESCRIBE JoinRequests;
DESCRIBE Notifications;