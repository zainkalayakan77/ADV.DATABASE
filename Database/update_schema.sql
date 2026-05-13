-- Database Update Script - Add new features to existing database
-- Run this if you already have data you want to keep

USE student_tracker;

-- 1. Add teacher_notes column to Activities table
ALTER TABLE Activities ADD COLUMN teacher_notes TEXT AFTER attachment_path;

-- 2. Add status and kick-related columns to Enrollments table
ALTER TABLE Enrollments 
ADD COLUMN status ENUM('Active', 'Kicked', 'Pending') DEFAULT 'Active' AFTER role,
ADD COLUMN kicked_at TIMESTAMP NULL AFTER enrolled_at,
ADD COLUMN kicked_by INT NULL AFTER kicked_at,
ADD FOREIGN KEY (kicked_by) REFERENCES Users(user_id) ON DELETE SET NULL;

-- 3. Create JoinRequests table
CREATE TABLE JoinRequests (
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

-- 4. Create Notifications table
CREATE TABLE Notifications (
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

-- 5. Create indexes for better performance
CREATE INDEX idx_notifications_user_read ON Notifications(user_id, is_read);
CREATE INDEX idx_join_requests_status ON JoinRequests(status);
CREATE INDEX idx_enrollments_status ON Enrollments(status);

-- 6. Update existing enrollments to have 'Active' status
UPDATE Enrollments SET status = 'Active' WHERE status IS NULL;

COMMIT;