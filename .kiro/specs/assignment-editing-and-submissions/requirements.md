# Requirements Document

## Introduction

This feature extends the classroom management system to support assignment editing by teachers and multi-format file submissions by students. Teachers can modify existing assignments and notify students of changes, while students can upload various academic file formats as submissions. The system provides submission tracking, validation, and secure file storage.

## Glossary

- **Activity**: An assignment or task created by a teacher for students to complete
- **Teacher**: A user with the Teacher role in a class who can create and edit activities
- **Student**: A user with the Student role in a class who can submit work for activities
- **Submission**: A student's uploaded file or content for an activity
- **Activity_Editor**: The UI component that allows teachers to modify activity details
- **File_Upload_Field**: The UI component that allows students to attach files
- **Submission_Validator**: The component that validates file uploads before submission
- **File_Storage_Service**: The backend service that securely stores uploaded files
- **Notification_Service**: The service that sends Gmail and in-app notifications
- **Activity_Card**: The UI component displaying activity summary information
- **Activity_View**: The detailed view page showing full activity information
- **Submission_Review_Panel**: The UI component showing all student submissions to teachers

## Requirements

### Requirement 1: Teacher Activity Editing

**User Story:** As a teacher, I want to edit existing assignments, so that I can correct mistakes or update requirements.

#### Acceptance Criteria

1. WHEN a teacher views an Activity_Card or Activity_View, THE System SHALL display an Edit button with a pencil icon
2. WHEN a teacher clicks the Edit button, THE Activity_Editor SHALL open with fields pre-filled with current Title, Description, Deadline, and Files
3. WHEN a teacher modifies activity fields and submits, THE System SHALL send a PUT request to update the activity record
4. THE Activity_Editor SHALL validate that Title is not empty before allowing submission
5. WHEN an activity update is successful, THE System SHALL display a success message to the teacher

### Requirement 2: Student Notification on Activity Updates

**User Story:** As a student, I want to be notified when my teacher edits an assignment, so that I am aware of changes.

#### Acceptance Criteria

1. WHEN a teacher updates an activity Title, THE Notification_Service SHALL send notifications to all enrolled students
2. WHEN a teacher updates an activity Deadline, THE Notification_Service SHALL send notifications to all enrolled students
3. WHEN a teacher updates an activity Description, THE Notification_Service SHALL send notifications to all enrolled students
4. THE Notification_Service SHALL send both Gmail and in-app notifications with the message format "Update: Your teacher has edited [Activity Name]"
5. THE Notification_Service SHALL include the specific change type in the notification message

### Requirement 3: Student File Upload Interface

**User Story:** As a student, I want to upload files for my assignments, so that I can submit my completed work.

#### Acceptance Criteria

1. WHEN a student views an Activity_View, THE System SHALL display a File_Upload_Field
2. THE File_Upload_Field SHALL accept files with extensions .docx, .pdf, .pptx, .jpg, .png
3. WHEN a student selects a file, THE System SHALL display the selected filename
4. THE File_Upload_Field SHALL display a "Submit" or "Turn In" button
5. WHEN no file is attached, THE System SHALL disable the Submit button

### Requirement 4: File Upload Validation

**User Story:** As a student, I want to know if my file is valid before submitting, so that I don't waste time on invalid uploads.

#### Acceptance Criteria

1. WHEN a student selects a file, THE Submission_Validator SHALL check the file extension
2. IF the file extension is not in the allowed list, THEN THE Submission_Validator SHALL display an error message
3. THE Submission_Validator SHALL prevent submission of files without valid extensions
4. WHEN a student attempts to submit without a file, THE Submission_Validator SHALL display an error message
5. THE Submission_Validator SHALL enable the Submit button only when a valid file is attached

### Requirement 5: Secure File Storage

**User Story:** As a system administrator, I want uploaded files stored securely, so that student data is protected.

#### Acceptance Criteria

1. WHEN a student submits a file, THE File_Storage_Service SHALL store the file on the server
2. THE File_Storage_Service SHALL link the file to the student's enrollment ID
3. THE File_Storage_Service SHALL sanitize filenames to remove special characters and scripts
4. THE File_Storage_Service SHALL generate unique filenames to prevent collisions
5. THE File_Storage_Service SHALL store files in a directory with restricted access permissions

### Requirement 6: File Size Configuration

**User Story:** As a system administrator, I want to configure maximum file upload sizes, so that server resources are managed.

#### Acceptance Criteria

1. THE System SHALL configure the server to accept files up to 20MB in size
2. WHEN a student attempts to upload a file larger than 20MB, THE System SHALL reject the upload
3. THE System SHALL display an error message indicating the maximum file size when upload is rejected
4. THE System SHALL configure the maximum file size through server configuration settings
5. THE System SHALL log rejected uploads for monitoring purposes

### Requirement 7: Teacher Submission Review

**User Story:** As a teacher, I want to see all student submissions, so that I can review and grade their work.

#### Acceptance Criteria

1. WHEN a teacher views an Activity_View, THE Submission_Review_Panel SHALL display a list of all enrolled students
2. FOR ALL students who have submitted files, THE Submission_Review_Panel SHALL display a green "Submitted" badge
3. FOR ALL students who have not submitted files, THE Submission_Review_Panel SHALL display their status
4. THE Submission_Review_Panel SHALL provide download links for each submitted file
5. THE Submission_Review_Panel SHALL provide view links for each submitted file

### Requirement 8: File Download and Viewing

**User Story:** As a teacher, I want to download and view student submissions, so that I can grade their work.

#### Acceptance Criteria

1. WHEN a teacher clicks a download link, THE System SHALL initiate a file download
2. WHEN a teacher clicks a view link, THE System SHALL display the file in the browser if the format supports it
3. THE System SHALL verify teacher access permissions before allowing file download
4. THE System SHALL log all file access attempts for security auditing
5. THE System SHALL preserve original filenames when downloading files

### Requirement 9: Submission Status Tracking

**User Story:** As a student, I want to see my submission status, so that I know if my work was received.

#### Acceptance Criteria

1. WHEN a student submits a file, THE System SHALL update the submission status to "Submitted"
2. WHEN a student views an Activity_View after submission, THE System SHALL display a "Submitted" badge
3. WHEN a teacher grades a submission, THE System SHALL update the status to "Graded"
4. THE System SHALL display the submission timestamp to the student
5. THE System SHALL allow students to view their submitted file

### Requirement 10: Multiple File Format Support

**User Story:** As a student, I want to submit various file types, so that I can use the format best suited for my work.

#### Acceptance Criteria

1. THE System SHALL accept Microsoft Word documents (.docx)
2. THE System SHALL accept PDF documents (.pdf)
3. THE System SHALL accept PowerPoint presentations (.pptx)
4. THE System SHALL accept JPEG images (.jpg)
5. THE System SHALL accept PNG images (.png)

### Requirement 11: Filename Sanitization Security

**User Story:** As a system administrator, I want filenames sanitized, so that malicious scripts cannot be executed.

#### Acceptance Criteria

1. WHEN a file is uploaded, THE File_Storage_Service SHALL remove all special characters except alphanumeric, dash, underscore, and period
2. THE File_Storage_Service SHALL replace spaces with underscores
3. THE File_Storage_Service SHALL convert filenames to lowercase
4. THE File_Storage_Service SHALL truncate filenames longer than 255 characters
5. THE File_Storage_Service SHALL reject files with double extensions (e.g., .pdf.exe)

### Requirement 12: Edit Button Placement

**User Story:** As a teacher, I want the Edit button easily accessible, so that I can quickly modify assignments.

#### Acceptance Criteria

1. THE System SHALL display the Edit button on the Activity_Card for teachers
2. THE System SHALL display the Edit button on the Activity_View for teachers
3. THE System SHALL hide the Edit button from students
4. THE Edit button SHALL use a pencil icon for visual recognition
5. THE Edit button SHALL be positioned consistently across all activity displays
