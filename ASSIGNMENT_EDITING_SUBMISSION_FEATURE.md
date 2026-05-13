# Assignment Editing & Student File Submissions Feature

## Overview
This document describes the implementation of the assignment editing and student file submission features for the Student Activity Tracker system.

## Features Implemented

### 1. Teacher Feature: Edit Assignment ✅

#### UI Components
- **Edit Button**: A pencil icon button appears in the Activity Details page header for teachers
- **Edit Modal**: Pre-filled form with current activity data including:
  - Title
  - Description
  - Deadline
  - Teacher Notes (private)
  - Current attachments display
  - Option to add more files

#### Functionality
- Teachers can edit any activity they created
- Form is pre-populated with existing data
- Changes are validated before submission
- File uploads are supported (new files are added to existing attachments)
- Teacher role verification on backend

#### Notifications
- When major changes are made (title, description, or deadline), the system:
  - Sends in-app notifications to all enrolled students
  - Sends email notifications via Gmail
  - Notification message includes what was changed
  - Example: "Your teacher has edited 'Math Assignment'. The deadline has been updated."

#### API Endpoint
```
PUT /api/activities/:activityId
- Requires authentication
- Accepts multipart/form-data for file uploads
- Fields: title, description, deadline, teacher_notes, files[]
- Returns: success message, notifications_sent flag, files_added count
```

---

### 2. Student Feature: Multi-Format File Upload ✅

#### Supported File Formats
- **Documents**: .docx, .doc, .pdf, .txt
- **Presentations**: .pptx, .ppt
- **Images**: .jpg, .jpeg, .png, .gif
- **File Size Limit**: 20MB per file

#### UI Components
- **File Upload Field**: Appears on Activity Detail page for students
- **File Preview**: Shows selected file name and size
- **Validation Indicator**: Real-time validation with visual feedback
- **Submit Button**: Disabled until either text or file is provided

#### Validation Logic
- Students must provide either text content OR a file (or both)
- File size validation (max 20MB)
- File type validation (only allowed formats)
- Submit button is disabled when no content is provided
- Clear error messages for validation failures

#### Storage
- Files are stored in `Backend/uploads/activities/` directory
- Filenames are sanitized to prevent security issues
- Unique timestamp-based naming: `file-{timestamp}-{random}-{sanitized-name}`
- File paths are linked to student's enrollment ID in database

#### API Endpoint
```
POST /api/activities/:activityId/submit
- Requires authentication
- Accepts multipart/form-data
- Fields: content (optional), file (optional)
- At least one field must be provided
- Returns: success message, file_uploaded flag, file_info, overdue warning
```

---

### 3. Teacher View: Submission Review ✅

#### Features
- **Complete Student List**: Shows ALL enrolled students, not just those who submitted
- **Submission Status**: 
  - Green "Submitted" badge for students who uploaded work
  - "Not Submitted" indicator for students who haven't submitted
- **File Download Links**: Direct download buttons for each submission
- **Text Content Display**: Shows student's written work if provided
- **Grading Interface**: Grade button for ungraded submissions

#### Submission Display
Each submission shows:
- Student name and email
- Submission date (if submitted)
- Text content (if provided)
- Attached file with download link (if provided)
- Current grade and feedback (if graded)
- Grade button (if not yet graded)

#### Download Functionality
- Teachers can download any student's submitted file
- Students can download their own submitted files
- Access control ensures privacy
- Files are served with original filenames

---

### 4. Backend & Server Configuration ✅

#### File Upload Configuration
```javascript
// Multer configuration in activityController.js
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 20 * 1024 * 1024, // 20MB limit
        files: 10 // Maximum 10 files
    },
    fileFilter: (req, file, cb) => {
        // Validates file types
    }
});
```

#### Security Features
1. **Filename Sanitization**: Removes special characters to prevent script injection
   ```javascript
   const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
   ```

2. **File Type Validation**: Checks both MIME type and file extension
3. **Size Limits**: Enforced at 20MB per file
4. **Access Control**: 
   - Students can only download their own submissions
   - Teachers can download all submissions in their classes
   - Authentication required for all downloads

5. **Directory Security**: 
   - Upload directory is created with proper permissions
   - Files are stored outside web root
   - Downloads are served through authenticated API endpoints

#### Database Schema
The `Submissions` table includes:
```sql
CREATE TABLE Submissions (
    submission_id INT PRIMARY KEY AUTO_INCREMENT,
    activity_id INT NOT NULL,
    user_id INT NOT NULL,
    content TEXT,
    file_path VARCHAR(500),  -- Stores filename
    score DECIMAL(5,2) DEFAULT NULL,
    feedback TEXT,
    submission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (activity_id) REFERENCES Activities(activity_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_submission (activity_id, user_id)
);
```

---

## Technical Implementation Details

### Frontend Changes

#### Files Modified
1. **Frontend/js/classes.js**
   - Added `showEditActivityModal()` function
   - Added `handleEditActivity()` function
   - Updated `renderActivityDetails()` to show Edit button
   - Enhanced `submitActivity()` to support file uploads
   - Added `validateSubmissionFile()` for real-time validation
   - Added `clearSubmissionFile()` helper function
   - Updated submission display to show files

2. **Frontend/index.html**
   - Added Edit Activity modal
   - Enhanced submission form with file input
   - Added file preview area

3. **Frontend/css/styles.css**
   - Added styles for file upload components
   - Added styles for submission status badges
   - Added styles for attachment items
   - Added responsive styles for mobile devices

### Backend Changes

#### Files Modified
1. **Backend/Controllers/activityController.js**
   - Enhanced `updateActivity()` to support file uploads and teacher verification
   - Enhanced `submitWork()` to validate file requirements
   - Updated `getActivityDetails()` to show all students for teachers
   - Added file info parsing for submissions

2. **Backend/Routes/activityRoutes.js**
   - Updated PUT route to include `uploadFiles` middleware

### API Endpoints Summary

| Method | Endpoint | Purpose | Auth Required |
|--------|----------|---------|---------------|
| PUT | `/api/activities/:activityId` | Edit activity | Teacher |
| POST | `/api/activities/:activityId/submit` | Submit work | Student |
| GET | `/api/activities/:activityId` | Get activity details | Yes |
| GET | `/api/activities/:activityId/download/:filename` | Download activity file | Yes |
| GET | `/api/activities/submissions/:submissionId/download` | Download submission file | Yes |

---

## User Workflows

### Teacher Workflow: Editing an Assignment

1. Navigate to Activity Details page
2. Click the "Edit" button (pencil icon) in the header
3. Modal opens with pre-filled form
4. Make desired changes:
   - Update title, description, or deadline
   - Modify teacher notes
   - Add additional files
5. Click "Save Changes"
6. System validates changes
7. If major changes detected, students are notified via:
   - In-app notification
   - Email notification
8. Success message displayed
9. Activity details page refreshes with updated information

### Student Workflow: Submitting Work

1. Navigate to Activity Details page
2. View assignment instructions and attachments
3. Choose submission method:
   - **Option A**: Type text in the textarea
   - **Option B**: Attach a file
   - **Option C**: Both text and file
4. If attaching file:
   - Click file input
   - Select file from device
   - System validates file (type and size)
   - File preview appears
5. Submit button becomes enabled when content is provided
6. Click "Turn In" button
7. Confirm submission
8. System processes submission
9. Success message displayed
10. Page refreshes to show submitted work

### Teacher Workflow: Reviewing Submissions

1. Navigate to Activity Details page
2. Scroll to "Student Submissions" section
3. View complete list of students:
   - Students who submitted (with green badge)
   - Students who haven't submitted
4. For each submission:
   - Read text content (if provided)
   - Download attached file (if provided)
   - View submission date
5. Grade submissions as needed
6. Provide feedback

---

## Security Considerations

### Implemented Security Measures

1. **Authentication & Authorization**
   - All endpoints require valid JWT token
   - Role-based access control (teachers can edit, students can submit)
   - Ownership verification for downloads

2. **File Upload Security**
   - Filename sanitization prevents path traversal attacks
   - File type validation prevents malicious uploads
   - Size limits prevent DoS attacks
   - Files stored with unique names to prevent overwrites

3. **Input Validation**
   - All form inputs are validated on both client and server
   - SQL injection prevention through parameterized queries
   - XSS prevention through HTML escaping in frontend

4. **Access Control**
   - Students can only access their own submissions
   - Teachers can only access submissions in their classes
   - Kicked/blocked users cannot submit work

5. **Archive Protection**
   - Submissions blocked in archived classes
   - Read-only mode enforced on frontend and backend

---

## Testing Recommendations

### Manual Testing Checklist

#### Teacher Edit Feature
- [ ] Edit button appears only for teachers
- [ ] Edit button hidden in archived classes
- [ ] Form pre-fills with current data
- [ ] Can update title, description, deadline
- [ ] Can add new files to existing attachments
- [ ] Notifications sent when major changes made
- [ ] Non-teachers cannot access edit endpoint
- [ ] Changes persist after page refresh

#### Student Submission Feature
- [ ] File input accepts all supported formats
- [ ] File input rejects unsupported formats
- [ ] File size validation works (20MB limit)
- [ ] Submit button disabled without content
- [ ] Submit button enabled with text only
- [ ] Submit button enabled with file only
- [ ] Submit button enabled with both text and file
- [ ] File preview shows correct information
- [ ] Can clear selected file
- [ ] Submission succeeds with text only
- [ ] Submission succeeds with file only
- [ ] Submission succeeds with both
- [ ] Cannot submit in archived classes
- [ ] Overdue warning appears when past deadline

#### Teacher Review Feature
- [ ] All enrolled students appear in list
- [ ] Submitted students show green badge
- [ ] Non-submitted students show appropriate indicator
- [ ] Can download student files
- [ ] Text content displays correctly
- [ ] File download works
- [ ] Can grade submissions
- [ ] Submission dates display correctly

### Edge Cases to Test
1. Very large files (near 20MB limit)
2. Files with special characters in names
3. Multiple rapid submissions (update behavior)
4. Editing activity while students are viewing it
5. Submitting after deadline
6. Network interruption during upload
7. Concurrent edits by multiple teachers
8. File with no extension
9. Empty file (0 bytes)

---

## Future Enhancements

### Potential Improvements
1. **Bulk Download**: Allow teachers to download all submissions as a ZIP file
2. **File Preview**: Show preview of images/PDFs without downloading
3. **Version History**: Track multiple submission versions
4. **Rubric Support**: Add grading rubrics for consistent evaluation
5. **Peer Review**: Allow students to review each other's work
6. **Plagiarism Detection**: Integrate with plagiarism checking services
7. **Rich Text Editor**: Support formatted text in submissions
8. **Video Submissions**: Support video file uploads
9. **Submission Comments**: Allow threaded comments on submissions
10. **Auto-grading**: Integrate with auto-grading systems for certain file types

---

## Troubleshooting

### Common Issues

#### File Upload Fails
- **Check**: Server upload directory permissions
- **Check**: File size under 20MB
- **Check**: File type is supported
- **Check**: Server disk space available

#### Edit Button Not Appearing
- **Check**: User is logged in as teacher
- **Check**: Class is not archived
- **Check**: User has active enrollment in class

#### Notifications Not Sending
- **Check**: Email service configured correctly
- **Check**: SMTP credentials valid
- **Check**: Students have valid email addresses
- **Check**: Email service not rate-limited

#### Download Not Working
- **Check**: File exists in uploads directory
- **Check**: User has permission to access file
- **Check**: File path in database is correct

---

## Conclusion

This implementation provides a complete assignment editing and file submission system with:
- ✅ Intuitive UI for teachers and students
- ✅ Comprehensive file format support
- ✅ Robust security measures
- ✅ Real-time validation and feedback
- ✅ Automatic notifications for changes
- ✅ Complete submission tracking for teachers

The system is production-ready and follows best practices for web application security and user experience.
