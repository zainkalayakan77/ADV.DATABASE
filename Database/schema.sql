-- Student Activity Tracker Database Schema
-- Implements single-account system with dynamic role assignment

CREATE DATABASE IF NOT EXISTS student_tracker;
USE student_tracker;

-- 1. Users Table - Single account type for all users
CREATE TABLE Users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Classes Table - Stores class information with archive status
CREATE TABLE Classes (
    class_id INT PRIMARY KEY AUTO_INCREMENT,
    class_name VARCHAR(100) NOT NULL,
    class_code VARCHAR(10) UNIQUE NOT NULL,
    description TEXT,
    subject VARCHAR(100),
    section VARCHAR(50),
    status ENUM('Active', 'Archived') DEFAULT 'Active',
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    archived_at TIMESTAMP NULL,
    FOREIGN KEY (created_by) REFERENCES Users(user_id) ON DELETE CASCADE
);

-- 3. Enrollments Table - Dynamic role assignment per class with kick/block functionality
CREATE TABLE Enrollments (
    enrollment_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    class_id INT NOT NULL,
    role ENUM('Teacher', 'Student') NOT NULL,
    status ENUM('Active', 'Kicked', 'Pending') DEFAULT 'Active',
    is_archived BOOLEAN DEFAULT FALSE COMMENT 'Personal archive status for this enrollment',
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    kicked_at TIMESTAMP NULL,
    kicked_by INT NULL,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES Classes(class_id) ON DELETE CASCADE,
    FOREIGN KEY (kicked_by) REFERENCES Users(user_id) ON DELETE SET NULL,
    UNIQUE KEY unique_enrollment (user_id, class_id)
);

-- 4. Activities Table - Class activities/assignments with enhanced features
CREATE TABLE Activities (
    activity_id INT PRIMARY KEY AUTO_INCREMENT,
    class_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    deadline DATETIME,
    is_accepting_submissions BOOLEAN DEFAULT TRUE COMMENT 'Controls whether students can submit work for this activity',
    attachment_path VARCHAR(500),
    teacher_notes TEXT, -- Private notes only visible to teacher
    grading_note TEXT, -- Private grading rubric/notes for teacher reference
    max_score DECIMAL(5,2) DEFAULT 100.00,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES Classes(class_id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES Users(user_id) ON DELETE CASCADE
);

-- 5. Submissions Table - Student submissions for activities
CREATE TABLE Submissions (
    submission_id INT PRIMARY KEY AUTO_INCREMENT,
    activity_id INT NOT NULL,
    user_id INT NOT NULL,
    content TEXT,
    file_path VARCHAR(500),
    score DECIMAL(5,2) DEFAULT NULL,
    feedback TEXT,
    submission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (activity_id) REFERENCES Activities(activity_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_submission (activity_id, user_id)
);

-- 6. Join Requests Table - Handle requests from kicked members
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

-- 7. Notifications Table - System notifications for teachers
CREATE TABLE Notifications (
    notification_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    type ENUM('join_request', 'new_submission', 'system') NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    related_id INT NULL, -- Can reference join_request_id, submission_id, etc.
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_enrollments_user_class ON Enrollments(user_id, class_id);
CREATE INDEX idx_enrollments_status ON Enrollments(status);
CREATE INDEX idx_activities_class ON Activities(class_id);
CREATE INDEX idx_submissions_activity ON Submissions(activity_id);
CREATE INDEX idx_submissions_user ON Submissions(user_id);
CREATE INDEX idx_classes_code ON Classes(class_code);
CREATE INDEX idx_classes_status ON Classes(status);
CREATE INDEX idx_notifications_user_read ON Notifications(user_id, is_read);
CREATE INDEX idx_join_requests_status ON JoinRequests(status);

-- Insert sample data for testing
INSERT INTO Users (name, email, password) VALUES 
('John Teacher', 'john@teacher.com', '$2b$10$example_hashed_password'),
('Jane Student', 'jane@student.com', '$2b$10$example_hashed_password'),
('Bob Student', 'bob@student.com', '$2b$10$example_hashed_password');

INSERT INTO Classes (class_name, class_code, description, created_by) VALUES 
('Mathematics 101', 'MATH101', 'Basic Mathematics Course', 1),
('Computer Science', 'CS101', 'Introduction to Programming', 1);

INSERT INTO Enrollments (user_id, class_id, role, status) VALUES 
(1, 1, 'Teacher', 'Active'),
(1, 2, 'Teacher', 'Active'),
(2, 1, 'Student', 'Active'),
(2, 2, 'Student', 'Active'),
(3, 1, 'Student', 'Active');

INSERT INTO Activities (class_id, title, description, deadline, created_by) VALUES 
(1, 'Algebra Assignment', 'Solve the given algebra problems', '2024-12-31 23:59:59', 1),
(2, 'Hello World Program', 'Write your first program', '2024-12-25 23:59:59', 1);

INSERT INTO Submissions (activity_id, user_id, content, score, feedback) VALUES 
(1, 2, 'My algebra solutions...', 85.5, 'Good work, but check problem 3'),
(1, 3, 'Here are my answers...', 92.0, 'Excellent work!'),
(2, 2, 'console.log("Hello World");', 100.0, 'Perfect!');