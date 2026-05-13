# Student Activity Tracker - Feature Documentation

## System Architecture Overview

The Student Activity Tracker follows a **client-server architecture** with clear separation of concerns:

- **Frontend**: Responsive web interface built with HTML5, CSS3, and vanilla JavaScript
- **Backend**: RESTful API server using Node.js and Express.js
- **Database**: MySQL relational database with normalized schema
- **Authentication**: JWT-based authentication with bcrypt password hashing

## Core System Logic

### Single Account System with Dynamic Roles

**Key Innovation**: Unlike traditional systems with fixed user types (Admin/Teacher/Student), this system implements a **single User account type** with **dynamic role assignment per class**.

#### How It Works:
1. **Registration**: All users register with the same account type
2. **Class Creation**: When a user creates a class, they automatically become a **Teacher** for that class
3. **Class Joining**: When a user joins a class, they become a **Student** for that class
4. **Role Flexibility**: A single user can be:
   - Teacher in Class A
   - Student in Class B
   - Teacher in Class C

#### Database Implementation:
```sql
-- Single account type
CREATE TABLE Users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);

-- Dynamic role assignment
CREATE TABLE Enrollments (
    enrollment_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    class_id INT NOT NULL,
    role ENUM('Teacher', 'Student') NOT NULL,
    UNIQUE KEY unique_enrollment (user_id, class_id)
);
```

## Authentication & Security

### JWT-Based Authentication
- **Registration**: Password hashed with bcrypt (10 salt rounds)
- **Login**: JWT token issued with 24-hour expiration
- **Authorization**: Bearer token validation on protected routes
- **Session Management**: Client-side token storage with automatic refresh

### Security Features
- Input validation and sanitization
- SQL injection prevention with parameterized queries
- XSS protection through proper data escaping
- CORS configuration for cross-origin requests
- Role-based access control per endpoint

## Class Management System

### Class Creation Process
1. User provides class name and optional description
2. System generates unique 6-character alphanumeric code
3. Class record created in database
4. Creator automatically enrolled as Teacher
5. Class code shared for student enrollment

### Join Class Process
1. Student enters 6-character class code
2. System validates code existence
3. Checks for existing enrollment (prevents duplicates)
4. Creates enrollment record with Student role
5. User gains access to class activities

### Member Management (Advanced Feature)
Teachers can:
- View all class members with roles
- Add users manually via email search
- Update member roles using dropdown interface
- Promote Students to Teachers
- Demote Teachers to Students (with restrictions)

**Restriction**: Original class creator cannot be demoted (optional business rule)

## Activity Management System

### Activity Lifecycle
1. **Creation** (Teachers only):
   - Title, description, deadline specification
   - Optional file attachments
   - Automatic creator tracking

2. **Student Interaction**:
   - View activity details and requirements
   - Submit text content or file uploads
   - View submission status and grades

3. **Teacher Grading**:
   - Review all student submissions
   - Assign numerical scores (0-100)
   - Provide written feedback
   - Track grading progress

### Submission System
- **Single Submission Model**: One submission per student per activity
- **Update Capability**: Students can update submissions before deadline
- **Deadline Enforcement**: Optional deadline checking (configurable)
- **Grading Workflow**: Teachers can grade and provide feedback

### Student Activity Categorization (NEW)
**Purpose**: Help students organize and track their activities efficiently

**Features**:
- **Tab-Based Filtering**: Four categories for easy navigation
  - **All**: Complete list of all activities
  - **Assigned**: Unsubmitted activities before deadline (Blue badge)
  - **Submitted**: All submitted work, graded or pending (Green badge)
  - **Missing**: Overdue activities without submission (Red badge)

- **Visual Status Indicators**: Color-coded badges on each activity card
  - Blue: Assigned (work to be done)
  - Green: Submitted/Graded (work completed)
  - Red: Missing (urgent attention needed)

- **Tab Counts**: Real-time count badges showing number of activities per category
  - Example: "Missing (3)" or "Assigned (5)"
  - Creates urgency and helps time management

- **Empty State Messages**: Encouraging feedback when categories are empty
  - "You're all caught up!" for empty Assigned tab
  - "Great job! You have no missing assignments." for empty Missing tab

- **Client-Side Filtering**: Instant tab switching without server calls
  - All filtering happens in browser using cached data
  - Smooth, responsive user experience
  - No loading delays when switching categories

**Filtering Logic**:
```javascript
// Assigned: Not submitted AND before deadline
activities.filter(a => !a.submission_id && new Date(a.deadline) >= now)

// Submitted: Has submission record
activities.filter(a => a.submission_id !== null)

// Missing: Not submitted AND past deadline
activities.filter(a => !a.submission_id && new Date(a.deadline) < now)
```

**Teacher View**: Teachers see the traditional list view without tabs, as they need to monitor all student submissions rather than personal progress.

**Documentation**: See `STUDENT_ACTIVITY_CATEGORIZATION.md` for detailed implementation guide.

## Dashboard & Analytics System

### Personal Dashboard
Displays comprehensive user statistics:
- Classes teaching vs. enrolled
- Activities created and submitted
- Average performance scores
- Pending grading tasks

### Recent Activities Feed
- Shows upcoming deadlines
- Submission status tracking
- Score notifications
- Overdue activity alerts

### Performance Analytics
- Class-by-class performance breakdown
- Submission trends over time
- Comparative analysis with class averages
- Achievement categorization (Excellent/Good/Average/Needs Improvement)

## Advanced Reporting System

### 1. Student Performance Report
**Purpose**: Analyze individual student performance across classes

**Features**:
- Performance ranking within each class
- Score distribution analysis
- Comparison with class averages
- Performance categorization
- Submission completion rates

**SQL Implementation**:
```sql
-- Uses CTE for complex calculations
WITH StudentStats AS (
    SELECT u.user_id, u.name, c.class_name,
           AVG(s.score) as average_score,
           COUNT(s.submission_id) as total_submissions,
           RANK() OVER (PARTITION BY c.class_id ORDER BY AVG(s.score) DESC) as class_rank
    FROM Users u
    JOIN Enrollments e ON u.user_id = e.user_id
    JOIN Classes c ON e.class_id = c.class_id
    LEFT JOIN Activities a ON c.class_id = a.class_id
    LEFT JOIN Submissions s ON a.activity_id = s.activity_id AND s.user_id = u.user_id
    WHERE e.role = 'Student'
    GROUP BY u.user_id, u.name, c.class_id, c.class_name
)
SELECT * FROM StudentStats ORDER BY class_name, average_score DESC;
```

### 2. Activity Analysis Report
**Purpose**: Evaluate activity effectiveness and student engagement

**Metrics**:
- Completion rates per activity
- Score distributions
- Engagement levels (High/Low based on completion rates)
- Deadline adherence analysis

**Key Calculations**:
- Completion Rate = (Submissions Received / Total Students) × 100
- Engagement Level = Comparison with average completion rates
- Score Statistics = MIN, MAX, AVG, STDDEV

### 3. Class Overview Report
**Purpose**: Comprehensive class management statistics

**Information Provided**:
- Member counts (Teachers vs Students)
- Activity and submission totals
- Overall class performance averages
- Upcoming vs overdue activities
- Class creation and growth metrics

### 4. Submission Trends Report
**Purpose**: Temporal analysis of submission patterns

**Analytics**:
- Daily submission counts over time
- Rolling 7-day averages
- Peak submission hours identification
- Seasonal patterns and trends

## SQL Requirements Implementation

### 1. Aggregation Functions (All Required Functions Used)

**COUNT()** - Counting records:
```sql
SELECT COUNT(DISTINCT e.user_id) as total_students
FROM Enrollments e WHERE e.role = 'Student'
```

**AVG()** - Average calculations:
```sql
SELECT AVG(s.score) as class_average
FROM Submissions s
JOIN Activities a ON s.activity_id = a.activity_id
WHERE a.class_id = ?
```

**MAX() / MIN()** - Range calculations:
```sql
SELECT MAX(s.score) as highest_score, MIN(s.score) as lowest_score
FROM Submissions s WHERE s.activity_id = ?
```

**SUM()** - Total calculations:
```sql
SELECT SUM(CASE WHEN s.score >= 90 THEN 1 ELSE 0 END) as excellent_scores
FROM Submissions s WHERE s.user_id = ?
```

### 2. JOIN Queries (Multiple Complex Joins)

**Multi-table joins for comprehensive data**:
```sql
SELECT u.name, c.class_name, a.title, s.score, s.feedback
FROM Users u
JOIN Enrollments e ON u.user_id = e.user_id
JOIN Classes c ON e.class_id = c.class_id
JOIN Activities a ON c.class_id = a.class_id
LEFT JOIN Submissions s ON a.activity_id = s.activity_id AND s.user_id = u.user_id
WHERE e.role = 'Student'
ORDER BY u.name, c.class_name;
```

### 3. Subqueries (3+ Implemented)

**Subquery 1** - Students above average:
```sql
SELECT u.name, s.score
FROM Users u
JOIN Submissions s ON u.user_id = s.user_id
WHERE s.score > (SELECT AVG(score) FROM Submissions WHERE score IS NOT NULL);
```

**Subquery 2** - Latest submissions:
```sql
SELECT u.name, a.title, s.submission_date
FROM Users u
JOIN Submissions s ON u.user_id = s.user_id
JOIN Activities a ON s.activity_id = a.activity_id
WHERE s.submission_date = (
    SELECT MAX(s2.submission_date)
    FROM Submissions s2
    WHERE s2.user_id = s.user_id AND s2.activity_id = s.activity_id
);
```

**Subquery 3** - Most popular activities:
```sql
SELECT a.title, c.class_name
FROM Activities a
JOIN Classes c ON a.class_id = c.class_id
WHERE (SELECT COUNT(*) FROM Submissions s WHERE s.activity_id = a.activity_id) = (
    SELECT MAX(submission_count) FROM (
        SELECT COUNT(*) as submission_count
        FROM Submissions GROUP BY activity_id
    ) as counts
);
```

### 4. Common Table Expressions (CTE)

**Complex analytics with CTE**:
```sql
WITH StudentAverages AS (
    SELECT u.user_id, u.name,
           AVG(s.score) as average_score,
           COUNT(s.submission_id) as total_submissions
    FROM Users u
    LEFT JOIN Submissions s ON u.user_id = s.user_id
    WHERE s.score IS NOT NULL
    GROUP BY u.user_id, u.name
),
ClassEnrollments AS (
    SELECT u.user_id, COUNT(e.enrollment_id) as classes_enrolled
    FROM Users u
    LEFT JOIN Enrollments e ON u.user_id = e.user_id
    WHERE e.role = 'Student'
    GROUP BY u.user_id
)
SELECT sa.name, sa.average_score, ce.classes_enrolled,
       CASE 
           WHEN sa.average_score >= 90 THEN 'Excellent'
           WHEN sa.average_score >= 80 THEN 'Good'
           ELSE 'Needs Improvement'
       END as performance_category
FROM StudentAverages sa
LEFT JOIN ClassEnrollments ce ON sa.user_id = ce.user_id
ORDER BY sa.average_score DESC;
```

## User Interface Design

### Google Classroom Inspiration
The UI follows Google Classroom's design principles:
- **Card-based layout** for classes and activities
- **Clean, minimal interface** with plenty of whitespace
- **Sidebar navigation** with clear iconography
- **Responsive design** that works on all devices
- **Material Design** color scheme and typography

### Key UI Components

**Navigation Bar**:
- Fixed header with brand logo
- Main navigation links (Dashboard, Classes, Reports)
- User dropdown with profile and logout options

**Dashboard Cards**:
- Statistics cards with icons and numbers
- Recent activities feed with status indicators
- Class overview cards with role badges

**Class Management**:
- Grid layout for class cards
- Modal dialogs for creating/joining classes
- Tabbed interface for class details (Activities/Members)

**Activity Interface**:
- List view with submission status
- Detailed activity pages with submission forms
- Grading interface for teachers

**Reports Section**:
- Report type selection cards
- Tabular data presentation with sorting
- Export functionality (placeholder for future implementation)

### Responsive Design
- **Mobile-first approach** with breakpoints at 768px and 480px
- **Flexible grid layouts** that adapt to screen size
- **Touch-friendly interface** elements
- **Optimized typography** for readability on all devices

## API Architecture

### RESTful Design Principles
All API endpoints follow REST conventions:
- **GET** for data retrieval
- **POST** for resource creation
- **PUT** for resource updates
- **DELETE** for resource removal

### Endpoint Structure
```
/api/auth/*          - Authentication endpoints
/api/classes/*       - Class management
/api/activities/*    - Activity operations
/api/dashboard/*     - Analytics and statistics
/api/reports/*       - Report generation
```

### Middleware Stack
1. **CORS** - Cross-origin request handling
2. **JSON Parser** - Request body parsing
3. **Authentication** - JWT token validation
4. **Authorization** - Role-based access control
5. **Error Handling** - Centralized error management

### Response Format
Consistent JSON response structure:
```json
{
    "message": "Success message",
    "data": { /* Response data */ },
    "error": "Error message (if applicable)"
}
```

## Performance Optimizations

### Database Optimizations
- **Indexes** on frequently queried columns (user_id, class_id, activity_id)
- **Connection pooling** for efficient database connections
- **Prepared statements** to prevent SQL injection and improve performance
- **Efficient queries** with proper JOINs instead of multiple round trips

### Frontend Optimizations
- **Lazy loading** of data when navigating between pages
- **Client-side caching** of user data and class information
- **Debounced search** to reduce API calls
- **Optimized DOM manipulation** with minimal reflows

### Network Optimizations
- **Gzip compression** for API responses
- **CDN integration** for static assets (Font Awesome)
- **Efficient payload sizes** with selective data loading
- **HTTP/2 support** for multiplexed connections

## Security Implementation

### Authentication Security
- **bcrypt hashing** with 10 salt rounds for passwords
- **JWT tokens** with configurable expiration (24 hours default)
- **Secure token storage** recommendations for production
- **Session invalidation** on logout

### Input Validation
- **Server-side validation** for all user inputs
- **Email format validation** using regex patterns
- **Password strength requirements** (minimum 6 characters)
- **SQL injection prevention** through parameterized queries

### Access Control
- **Role-based permissions** enforced at API level
- **Class-specific authorization** checks
- **Teacher-only operations** properly protected
- **User isolation** - users can only access their own data

## Scalability Considerations

### Database Scalability
- **Normalized schema** to reduce data redundancy
- **Proper indexing strategy** for query optimization
- **Connection pooling** to handle concurrent users
- **Prepared for horizontal scaling** with read replicas

### Application Scalability
- **Stateless API design** for easy horizontal scaling
- **Modular architecture** with separated concerns
- **Caching strategies** for frequently accessed data
- **Load balancer ready** with session-less design

### Future Enhancements
- **Redis caching** for session management
- **File storage service** integration (AWS S3, etc.)
- **Real-time features** with WebSocket support
- **Microservices architecture** for large-scale deployment

## Testing Strategy

### Backend Testing
- **Unit tests** for individual functions
- **Integration tests** for API endpoints
- **Database tests** for SQL query validation
- **Authentication tests** for security verification

### Frontend Testing
- **UI component tests** for interface elements
- **User interaction tests** for form submissions
- **Cross-browser compatibility** testing
- **Responsive design** validation

### Security Testing
- **Penetration testing** for vulnerability assessment
- **SQL injection** prevention verification
- **XSS attack** protection validation
- **Authentication bypass** attempt testing

This comprehensive system demonstrates advanced full-stack development with proper database design, security implementation, and user experience considerations while meeting all specified requirements for SQL complexity and system architecture.