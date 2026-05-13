# Testing the Bug Fixes

## 🧪 **Test Plan for Bug Fixes**

### **Bug Fix 1: Kick Functionality**

**Test Steps:**
1. Login as a Teacher
2. Go to a class with students
3. Click "Kick" on a student
4. Verify the student is removed from the members list
5. Login as the kicked student
6. Verify they cannot see the class in their class list
7. Verify they get "Access denied" when trying to access the class directly

**Expected Results:**
- Student is immediately removed from class
- Student cannot access class activities
- Student is redirected to dashboard if they try to access the class

### **Bug Fix 2: Activity Visibility**

**Test Steps:**
1. Login as a Teacher
2. Create a new activity in a class
3. Logout and login as a Student in the same class
4. Go to the class page
5. Check the Activities tab
6. Verify the activity is visible

**Expected Results:**
- Students can see all activities created by teachers
- Activities show proper details (title, description, deadline)
- Students can interact with activities (submit work)

### **Database Update Required**

Before testing, run this SQL to update your database:

```sql
-- Add missing columns and tables
ALTER TABLE Activities ADD COLUMN teacher_notes TEXT AFTER attachment_path;

ALTER TABLE Enrollments 
ADD COLUMN status ENUM('Active', 'Kicked', 'Pending') DEFAULT 'Active' AFTER role,
ADD COLUMN kicked_at TIMESTAMP NULL AFTER enrolled_at,
ADD COLUMN kicked_by INT NULL AFTER kicked_at;

-- Set all existing enrollments to Active
UPDATE Enrollments SET status = 'Active' WHERE status IS NULL;

-- Create missing tables (if they don't exist)
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
    FOREIGN KEY (class_id) REFERENCES Classes(class_id) ON DELETE CASCADE
);

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
```

### **Key Changes Made:**

1. **Kick Functionality:**
   - Updated middleware to check `status = 'Active'` in enrollments
   - Modified all class queries to only show active members
   - Added proper error handling for kicked users
   - Kicked users are redirected to dashboard when trying to access restricted classes

2. **Activity Visibility:**
   - Fixed activity queries to ensure students see all activities
   - Added proper role-based access control
   - Improved error handling for access denied scenarios
   - Activities now display correctly for both teachers and students

3. **Database Schema:**
   - Added `status` column to Enrollments table
   - Added `teacher_notes` column to Activities table
   - Created Notifications and JoinRequests tables
   - Added proper indexes for performance

### **Verification Commands:**

Check if the fixes are working:

```sql
-- Check enrollment statuses
SELECT u.name, c.class_name, e.role, e.status 
FROM Users u 
JOIN Enrollments e ON u.user_id = e.user_id 
JOIN Classes c ON e.class_id = c.class_id;

-- Check activities visibility
SELECT a.title, c.class_name, u.name as created_by
FROM Activities a
JOIN Classes c ON a.class_id = c.class_id
JOIN Users u ON a.created_by = u.user_id;
```