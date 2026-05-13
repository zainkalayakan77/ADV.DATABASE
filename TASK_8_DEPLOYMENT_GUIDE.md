# Task 8: Deployment Guide

**Step-by-step instructions for deploying the new features to production**

---

## 📋 Pre-Deployment Checklist

### 1. Code Review
- [ ] All files committed to version control
- [ ] Code reviewed by team member
- [ ] No console.log statements in production code
- [ ] No hardcoded credentials
- [ ] Error handling implemented

### 2. Testing
- [ ] All unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] Browser compatibility verified
- [ ] Mobile responsiveness checked

### 3. Documentation
- [ ] Implementation summary reviewed
- [ ] Testing guide reviewed
- [ ] API documentation updated
- [ ] User guide updated (if applicable)

### 4. Backup
- [ ] Database backup created
- [ ] Code backup created
- [ ] Rollback plan prepared

---

## 🗄️ Database Migration

### Step 1: Backup Current Database

```bash
# Create backup
mysqldump -u root -p student_tracker > backup_$(date +%Y%m%d_%H%M%S).sql

# Verify backup
ls -lh backup_*.sql
```

### Step 2: Run Migration Script

**Option A: Command Line**
```bash
mysql -u root -p student_tracker < Database/add_announcements.sql
```

**Option B: MySQL Workbench**
1. Open MySQL Workbench
2. Connect to database
3. File → Open SQL Script
4. Select `Database/add_announcements.sql`
5. Execute (⚡ icon)

**Option C: phpMyAdmin**
1. Login to phpMyAdmin
2. Select `student_tracker` database
3. Click "SQL" tab
4. Copy contents of `Database/add_announcements.sql`
5. Paste and click "Go"

### Step 3: Verify Migration

```sql
-- Check table exists
SHOW TABLES LIKE 'Announcements';

-- Check table structure
DESCRIBE Announcements;

-- Expected output:
-- announcement_id (INT, PRI)
-- class_id (INT, MUL)
-- user_id (INT, MUL)
-- content (TEXT)
-- created_at (TIMESTAMP)
-- updated_at (TIMESTAMP)

-- Check indexes
SHOW INDEX FROM Announcements;

-- Expected: idx_class_announcements
```

### Step 4: Test Database

```sql
-- Insert test announcement
INSERT INTO Announcements (class_id, user_id, content) 
VALUES (1, 1, 'Test announcement');

-- Verify insert
SELECT * FROM Announcements;

-- Delete test announcement
DELETE FROM Announcements WHERE content = 'Test announcement';
```

---

## 📦 Backend Deployment

### Step 1: Stop Server

```bash
# If using PM2
pm2 stop student-tracker

# If using systemd
sudo systemctl stop student-tracker

# If running manually
# Press Ctrl+C in terminal
```

### Step 2: Deploy Backend Files

```bash
# Navigate to project directory
cd /path/to/student-tracker

# Pull latest code (if using Git)
git pull origin main

# Or copy files manually
cp -r Backend/Controllers/announcementController.js /path/to/production/Backend/Controllers/
cp -r Backend/Routes/announcementRoutes.js /path/to/production/Backend/Routes/
cp -r Backend/Controllers/activityController.js /path/to/production/Backend/Controllers/
cp -r Backend/server.js /path/to/production/Backend/
```

### Step 3: Install Dependencies (if any new)

```bash
cd Backend
npm install
```

### Step 4: Verify File Permissions

```bash
# Check uploads directory
ls -la Backend/uploads/activities/

# Set permissions if needed
chmod 755 Backend/uploads/activities/
```

### Step 5: Start Server

```bash
# If using PM2
pm2 start student-tracker
pm2 logs student-tracker

# If using systemd
sudo systemctl start student-tracker
sudo systemctl status student-tracker

# If running manually
cd Backend
node server.js
```

### Step 6: Verify Server

```bash
# Check health endpoint
curl http://localhost:3000/api/health

# Expected response:
# {"status":"OK","message":"Student Activity Tracker API is running","timestamp":"..."}

# Check announcements endpoint
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/announcements/class/1
```

---

## 🎨 Frontend Deployment

### Step 1: Deploy Frontend Files

```bash
# Copy files to production
cp Frontend/js/api.js /path/to/production/Frontend/js/
cp Frontend/js/classes.js /path/to/production/Frontend/js/
cp Frontend/css/styles.css /path/to/production/Frontend/css/
cp Frontend/index.html /path/to/production/Frontend/
```

### Step 2: Clear Cache

**If using CDN:**
```bash
# Purge CDN cache
# (Command depends on your CDN provider)
```

**If using Nginx:**
```bash
# Clear Nginx cache
sudo rm -rf /var/cache/nginx/*
sudo systemctl reload nginx
```

**If using Apache:**
```bash
# Clear Apache cache
sudo a2enmod expires
sudo systemctl restart apache2
```

### Step 3: Verify Static Files

```bash
# Check file permissions
ls -la Frontend/js/
ls -la Frontend/css/

# Test file access
curl http://localhost:3000/js/api.js
curl http://localhost:3000/css/styles.css
```

---

## 🧪 Post-Deployment Testing

### 1. Smoke Tests (5 minutes)

```bash
# Test announcements endpoint
curl -X POST http://localhost:3000/api/announcements/class/1 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"content":"Test announcement"}'

# Test get announcements
curl http://localhost:3000/api/announcements/class/1 \
  -H "Authorization: Bearer <token>"

# Test delete activity
curl -X DELETE http://localhost:3000/api/activities/999 \
  -H "Authorization: Bearer <token>"
```

### 2. Browser Tests

- [ ] Open application in browser
- [ ] Login as teacher
- [ ] Navigate to a class
- [ ] Post announcement
- [ ] View announcement
- [ ] Delete announcement
- [ ] Create activity with custom max_score
- [ ] Edit activity
- [ ] Delete activity
- [ ] Verify no console errors

### 3. User Acceptance Tests

- [ ] Teacher can post announcements
- [ ] Students can view announcements
- [ ] Teacher can delete activities
- [ ] Max score persists correctly
- [ ] All existing features still work

---

## 🔄 Rollback Procedure

### If Issues Occur

**Step 1: Stop Server**
```bash
pm2 stop student-tracker
# or
sudo systemctl stop student-tracker
```

**Step 2: Restore Database**
```bash
# Restore from backup
mysql -u root -p student_tracker < backup_YYYYMMDD_HHMMSS.sql

# Or just drop new table
mysql -u root -p student_tracker -e "DROP TABLE IF EXISTS Announcements;"
```

**Step 3: Restore Code**
```bash
# If using Git
git checkout HEAD~1

# Or restore from backup
cp -r /path/to/backup/Backend/* Backend/
cp -r /path/to/backup/Frontend/* Frontend/
```

**Step 4: Restart Server**
```bash
pm2 start student-tracker
# or
sudo systemctl start student-tracker
```

**Step 5: Verify Rollback**
```bash
# Check health
curl http://localhost:3000/api/health

# Verify announcements endpoint doesn't exist
curl http://localhost:3000/api/announcements/class/1
# Should return 404
```

---

## 📊 Monitoring

### Server Logs

```bash
# View real-time logs
tail -f Backend/logs/server.log

# Search for errors
grep -i "error" Backend/logs/server.log

# Search for announcement activity
grep -i "announcement" Backend/logs/server.log
```

### Database Monitoring

```sql
-- Monitor announcement creation
SELECT COUNT(*) as total_announcements FROM Announcements;

-- Monitor activity deletions
SELECT COUNT(*) as total_activities FROM Activities;

-- Check for orphaned files
SELECT attachment_path FROM Activities WHERE attachment_path IS NOT NULL;
```

### Performance Monitoring

```bash
# Check server response time
time curl http://localhost:3000/api/health

# Monitor memory usage
ps aux | grep node

# Monitor disk space
df -h Backend/uploads/
```

---

## 🔐 Security Checklist

### Post-Deployment Security

- [ ] SQL injection protection verified
- [ ] XSS protection verified (escapeHtml used)
- [ ] CSRF protection enabled
- [ ] Authentication required for all endpoints
- [ ] Authorization checks in place
- [ ] File upload validation working
- [ ] Rate limiting configured (if applicable)
- [ ] HTTPS enabled (production)

### Test Security

```bash
# Test SQL injection
curl -X POST http://localhost:3000/api/announcements/class/1 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"content":"Test'; DROP TABLE Announcements;--"}'
# Should be escaped and saved as text

# Test XSS
curl -X POST http://localhost:3000/api/announcements/class/1 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"content":"<script>alert(1)</script>"}'
# Should be escaped in frontend

# Test unauthorized access
curl http://localhost:3000/api/announcements/class/1
# Should return 401 Unauthorized
```

---

## 📈 Performance Optimization

### After Deployment

**1. Database Indexes**
```sql
-- Verify indexes exist
SHOW INDEX FROM Announcements;

-- Add additional indexes if needed
CREATE INDEX idx_user_announcements ON Announcements(user_id, created_at DESC);
```

**2. File Cleanup**
```bash
# Schedule periodic cleanup of orphaned files
# Add to crontab:
0 2 * * * /path/to/cleanup_orphaned_files.sh
```

**3. Cache Configuration**
```javascript
// Add caching headers (if using Express)
app.use('/uploads', express.static('uploads', {
    maxAge: '1d',
    etag: true
}));
```

---

## 📱 User Communication

### Announcement Template

```
Subject: New Features Available - Announcements & More!

Dear Users,

We're excited to announce new features in the Student Activity Tracker:

1. **Room Announcements** - Teachers can now post announcements to their classes
2. **Delete Activities** - Teachers can permanently delete activities with confirmation
3. **Improved Max Score** - Custom max scores now persist correctly

These features are now live. Please clear your browser cache (Ctrl+F5) to see the updates.

If you experience any issues, please contact support.

Thank you!
```

---

## 🐛 Troubleshooting

### Common Issues

**Issue: Announcements not loading**
```bash
# Check table exists
mysql -u root -p student_tracker -e "SHOW TABLES LIKE 'Announcements';"

# Check route registered
grep "announcementRoutes" Backend/server.js

# Check server logs
tail -f Backend/logs/server.log | grep announcement
```

**Issue: Delete activity fails**
```bash
# Check file permissions
ls -la Backend/uploads/activities/

# Check user is room creator
mysql -u root -p student_tracker -e "SELECT created_by FROM Classes WHERE class_id = 1;"

# Check server logs
grep "delete.*activity" Backend/logs/server.log
```

**Issue: Max score resets**
```bash
# Check database column
mysql -u root -p student_tracker -e "DESCRIBE Activities;"

# Check form submission
# Open browser DevTools → Network → Check request payload

# Check backend logs
grep "max_score" Backend/logs/server.log
```

---

## ✅ Deployment Verification

### Final Checklist

- [ ] Database migration successful
- [ ] Backend server running
- [ ] Frontend files deployed
- [ ] Cache cleared
- [ ] Smoke tests pass
- [ ] Browser tests pass
- [ ] No console errors
- [ ] No server errors
- [ ] Performance acceptable
- [ ] Security verified
- [ ] Monitoring configured
- [ ] Rollback plan tested
- [ ] Documentation updated
- [ ] Users notified

---

## 📞 Support Contacts

### If Issues Arise

**Technical Support:**
- Email: support@example.com
- Phone: (555) 123-4567
- Slack: #tech-support

**Database Admin:**
- Email: dba@example.com
- Phone: (555) 123-4568

**DevOps:**
- Email: devops@example.com
- Phone: (555) 123-4569

---

## 📝 Deployment Log

### Record Deployment Details

```
Deployment Date: _______________
Deployed By: _______________
Version: 1.0.0
Database Migration: ✅ / ❌
Backend Deployment: ✅ / ❌
Frontend Deployment: ✅ / ❌
Testing Complete: ✅ / ❌
Issues Encountered: _______________
Resolution: _______________
Rollback Required: Yes / No
Notes: _______________
```

---

## 🎉 Success!

If all checks pass, deployment is complete! 🚀

Monitor the system for the next 24-48 hours for any issues.

---

**Version:** 1.0.0  
**Last Updated:** May 13, 2026  
**Next Review:** [Date]
