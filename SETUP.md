# Student Activity Tracker - Setup Guide

## Prerequisites

Before setting up the Student Activity Tracker, ensure you have the following installed:

- **Node.js** (v14 or higher)
- **MySQL** (v8.0 or higher)
- **npm** (comes with Node.js)

## Installation Steps

### 1. Clone/Download the Project
```bash
# If using git
git clone <repository-url>
cd student-activity-tracker

# Or extract the downloaded files to a directory
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Database Setup

#### Create MySQL Database
1. Open MySQL command line or MySQL Workbench
2. Create the database:
```sql
CREATE DATABASE student_tracker;
```

#### Import Database Schema
```bash
# Using MySQL command line
mysql -u root -p student_tracker < Database/schema.sql

# Or copy and paste the contents of Database/schema.sql into MySQL Workbench
```

### 4. Environment Configuration
1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit `.env` file with your database credentials:
```env
# Database Configuration
DB_HOST=localhost
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=student_tracker

# JWT Secret (change this!)
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random
```

### 5. Start the Application
```bash
# Development mode (with auto-restart)
npm run dev

# Or production mode
npm start
```

### 6. Access the Application
Open your web browser and navigate to:
```
http://localhost:3000
```

## Default Test Data

The database schema includes sample data for testing:

**Test Users:**
- Teacher: `john@teacher.com` / `password123`
- Student 1: `jane@student.com` / `password123`  
- Student 2: `bob@student.com` / `password123`

**Test Classes:**
- Mathematics 101 (Code: MATH101)
- Computer Science (Code: CS101)

## Project Structure

```
student-activity-tracker/
├── Backend/                 # Server-side code
│   ├── Controllers/         # Business logic
│   ├── Routes/             # API routes
│   ├── middleware/         # Authentication & validation
│   ├── config/             # Database configuration
│   └── server.js           # Main server file
├── Frontend/               # Client-side code
│   ├── css/               # Stylesheets
│   ├── js/                # JavaScript files
│   └── index.html         # Main HTML file
├── Database/              # SQL scripts
│   ├── schema.sql         # Database schema
│   └── queries.sql        # Example queries
└── README.md              # Project documentation
```

## Key Features Implemented

### 1. Authentication System
- ✅ User registration with validation
- ✅ Secure login with JWT tokens
- ✅ Password hashing with bcrypt
- ✅ Session management

### 2. Dynamic Role System
- ✅ Single account type (User)
- ✅ Role assignment per class (Teacher/Student)
- ✅ Role switching between classes
- ✅ Permission-based access control

### 3. Class Management
- ✅ Create classes with unique codes
- ✅ Join classes via code
- ✅ Member management with role updates
- ✅ Class overview and statistics

### 4. Activity System
- ✅ Create/edit/delete activities
- ✅ File and text submissions
- ✅ Deadline management
- ✅ Grading and feedback

### 5. Dashboard & Analytics
- ✅ Personal statistics dashboard
- ✅ Recent activities overview
- ✅ Performance analytics
- ✅ Teacher workload analysis

### 6. Advanced Reporting
- ✅ Student performance reports
- ✅ Activity analysis with completion rates
- ✅ Class overview statistics
- ✅ Submission trends over time

### 7. SQL Requirements Met
- ✅ **Aggregation Functions**: COUNT(), AVG(), MAX(), MIN(), SUM()
- ✅ **JOIN Queries**: Multiple complex joins across all tables
- ✅ **Subqueries**: 3+ subqueries for advanced filtering
- ✅ **CTE**: Common Table Expressions for complex analytics
- ✅ **Relational Design**: 5 properly normalized tables

## Database Schema

### Tables Overview
1. **Users** - Single account type for all users
2. **Classes** - Class information with unique codes
3. **Enrollments** - Dynamic role assignment per class
4. **Activities** - Class assignments and tasks
5. **Submissions** - Student work and grades

### Key Relationships
- Users can have multiple enrollments (different roles per class)
- Classes can have multiple activities
- Activities can have multiple submissions
- Submissions link users to specific activities

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/logout` - User logout

### Classes
- `POST /api/classes` - Create class
- `POST /api/classes/join` - Join class
- `GET /api/classes` - Get user classes
- `GET /api/classes/:id` - Get class details
- `PUT /api/classes/:id/members` - Update member role

### Activities
- `POST /api/activities/class/:id` - Create activity
- `GET /api/activities/class/:id` - Get class activities
- `GET /api/activities/:id` - Get activity details
- `PUT /api/activities/:id` - Update activity
- `DELETE /api/activities/:id` - Delete activity
- `POST /api/activities/:id/submit` - Submit work
- `PUT /api/activities/submissions/:id/grade` - Grade submission

### Dashboard & Reports
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/dashboard/performance` - Performance analytics
- `GET /api/reports/student-performance` - Student reports
- `GET /api/reports/activity-analysis` - Activity reports
- `GET /api/reports/class-overview` - Class reports
- `GET /api/reports/submission-trends` - Trend reports

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check MySQL is running
   - Verify credentials in `.env` file
   - Ensure database exists

2. **Port Already in Use**
   - Change PORT in `.env` file
   - Kill process using the port: `lsof -ti:3000 | xargs kill`

3. **JWT Token Errors**
   - Clear browser localStorage
   - Check JWT_SECRET in `.env`

4. **Permission Denied Errors**
   - Check file permissions
   - Run with appropriate user privileges

### Development Tips

1. **Database Reset**
   ```bash
   # Drop and recreate database
   mysql -u root -p -e "DROP DATABASE student_tracker; CREATE DATABASE student_tracker;"
   mysql -u root -p student_tracker < Database/schema.sql
   ```

2. **View Logs**
   ```bash
   # Server logs are displayed in console
   # Check browser console for frontend errors
   ```

3. **API Testing**
   - Use browser developer tools
   - Test endpoints with Postman or curl
   - Check network tab for API responses

## Security Features

- ✅ Password hashing with bcrypt
- ✅ JWT token authentication
- ✅ Input validation and sanitization
- ✅ SQL injection prevention
- ✅ XSS protection
- ✅ CORS configuration
- ✅ Role-based access control

## Performance Optimizations

- ✅ Database indexing on key fields
- ✅ Connection pooling
- ✅ Efficient SQL queries with JOINs
- ✅ Client-side caching
- ✅ Responsive design for mobile

## Future Enhancements

Potential improvements for the system:
- File upload functionality for assignments
- Real-time notifications
- Email integration
- Advanced analytics with charts
- Mobile app development
- Integration with external LMS systems

## Support

For issues or questions:
1. Check this setup guide
2. Review the troubleshooting section
3. Check browser console for errors
4. Verify database connection and data