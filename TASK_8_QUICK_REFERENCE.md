# Task 8: Quick Reference Card

**Fast lookup for developers working with the new features**

---

## 🔧 Setup

### Database Migration
```bash
mysql -u root -p student_tracker < Database/add_announcements.sql
```

### Verify Table
```sql
SHOW TABLES LIKE 'Announcements';
```

---

## 📢 Announcements API

### Create Announcement
```javascript
POST /api/announcements/class/:classId
Headers: { Authorization: Bearer <token> }
Body: { content: "Your announcement text" }
```

### Get Announcements
```javascript
GET /api/announcements/class/:classId
Headers: { Authorization: Bearer <token> }
```

### Delete Announcement
```javascript
DELETE /api/announcements/:announcementId
Headers: { Authorization: Bearer <token> }
```

### Frontend Usage
```javascript
// Post announcement
await announcementAPI.create(classId, content);

// Get announcements
const data = await announcementAPI.getClassAnnouncements(classId);

// Delete announcement
await announcementAPI.delete(announcementId);
```

---

## 🗑️ Delete Activity API

### Delete Activity
```javascript
DELETE /api/activities/:activityId
Headers: { Authorization: Bearer <token> }
```

### Frontend Usage
```javascript
// Delete activity
const response = await fetch(`/api/activities/${activityId}`, {
    method: 'DELETE',
    headers: {
        'Authorization': `Bearer ${getAuthToken()}`
    }
});
```

### What Gets Deleted
- Activity record
- All submissions (CASCADE)
- All grades and feedback (CASCADE)
- Activity attachment files (physical)
- Submission files (physical)

---

## 📊 Max Score

### Database Column
```sql
Activities.max_score DECIMAL(5,2) DEFAULT 100.00
```

### Create Activity
```javascript
formData.append('max_score', maxScore);
```

### Edit Activity
```javascript
formData.append('max_score', maxScore);
```

### Validation
- Must be > 0
- Default: 100
- Decimal precision: 2 places

---

## 🎨 CSS Classes

### Announcements
```css
.announcements-section
.announcements-header
.announcement-post-form
.announcement-textarea
.announcements-feed
.announcement-item
.announcement-author
.announcement-content
.announcement-delete-btn
```

### Delete Button
```html
<button class="btn btn-error btn-lg" onclick="deleteActivityConfirm()">
    <i class="fas fa-trash"></i> Delete Activity
</button>
```

---

## 🔐 Permissions

### Announcements
| Action | Teacher | Student |
|--------|---------|---------|
| View | ✅ | ✅ |
| Post | ✅ | ❌ |
| Delete | ✅ | ❌ |

### Delete Activity
| Action | Room Creator | Co-Teacher | Student |
|--------|--------------|------------|---------|
| Delete | ✅ | ❌ | ❌ |

---

## 📁 File Structure

### Backend
```
Backend/
├── Controllers/
│   ├── announcementController.js (NEW)
│   └── activityController.js (MODIFIED)
├── Routes/
│   └── announcementRoutes.js (NEW)
└── server.js (MODIFIED)
```

### Frontend
```
Frontend/
├── js/
│   ├── api.js (MODIFIED)
│   └── classes.js (MODIFIED)
├── css/
│   └── styles.css (MODIFIED)
└── index.html (MODIFIED)
```

### Database
```
Database/
└── add_announcements.sql (NEW)
```

---

## 🐛 Common Issues

### Announcements Not Loading
```javascript
// Check console
console.log('Announcements:', data);

// Verify table exists
SHOW TABLES LIKE 'Announcements';

// Check route registration
app.use('/api/announcements', announcementRoutes);
```

### Delete Not Working
```javascript
// Verify user is room creator
SELECT created_by FROM Classes WHERE class_id = ?;

// Check file permissions
ls -la Backend/uploads/activities/
```

### Max Score Resetting
```javascript
// Check form includes field
console.log('Max Score:', formData.get('max_score'));

// Verify backend captures it
console.log('req.body.max_score:', req.body.max_score);

// Check database
SELECT activity_id, title, max_score FROM Activities;
```

---

## 🧪 Quick Test Commands

### Test Announcements
```javascript
// In browser console
await announcementAPI.create(1, "Test announcement");
await announcementAPI.getClassAnnouncements(1);
```

### Test Delete Activity
```javascript
// In browser console
await fetch('/api/activities/1', {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${getAuthToken()}` }
});
```

### Test Max Score
```sql
-- Check all activities
SELECT activity_id, title, max_score FROM Activities;

-- Update max score
UPDATE Activities SET max_score = 50 WHERE activity_id = 1;
```

---

## 📊 Database Queries

### View Announcements
```sql
SELECT a.*, u.name as author_name 
FROM Announcements a 
JOIN Users u ON a.user_id = u.user_id 
WHERE a.class_id = 1 
ORDER BY a.created_at DESC;
```

### Count Announcements
```sql
SELECT class_id, COUNT(*) as announcement_count 
FROM Announcements 
GROUP BY class_id;
```

### View Activities with Max Score
```sql
SELECT activity_id, title, max_score, created_at 
FROM Activities 
ORDER BY created_at DESC;
```

### Check Deleted Files
```bash
ls -la Backend/uploads/activities/ | wc -l
```

---

## 🚀 Deployment Checklist

- [ ] Run database migration
- [ ] Deploy backend files
- [ ] Deploy frontend files
- [ ] Restart server
- [ ] Clear browser cache
- [ ] Test announcements
- [ ] Test delete activity
- [ ] Test max score
- [ ] Verify file cleanup

---

## 📞 Support

### Debug Mode
```javascript
// Enable verbose logging
localStorage.setItem('debug', 'true');

// Check API calls
console.log('API Response:', await announcementAPI.getClassAnnouncements(1));
```

### Server Logs
```bash
# View server logs
tail -f Backend/logs/server.log

# Check for errors
grep "error" Backend/logs/server.log
```

---

## 🔗 Related Documentation

- [Full Implementation Summary](TASK_8_IMPLEMENTATION_SUMMARY.md)
- [Testing Guide](TASK_8_TESTING_GUIDE.md)
- [Database Schema](Database/schema.sql)
- [API Documentation](API_DOCUMENTATION.md)

---

**Version:** 1.0.0  
**Last Updated:** May 13, 2026
