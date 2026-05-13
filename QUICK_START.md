# Quick Start Guide - Get Running in 10 Minutes

## Step 1: Database Migration (2 minutes)

Open your terminal in the project directory and run:

```bash
node run_migration.js
```

You should see:
```
✅ Connected to database
✅ Migration executed successfully
✨ Migration completed successfully!
```

## Step 2: Install Email Package (1 minute)

```bash
npm install nodemailer
```

## Step 3: Configure Gmail (5 minutes)

### A. Enable 2-Factor Authentication
1. Go to https://myaccount.google.com/security
2. Click "2-Step Verification"
3. Follow the setup (usually phone verification)

### B. Generate App Password
1. Go back to https://myaccount.google.com/security
2. Click "2-Step Verification" → "App passwords" (at bottom)
3. Select: Mail + Other (Custom name)
4. Type: "Student Activity Tracker"
5. Click "Generate"
6. **COPY THE 16-CHARACTER PASSWORD**

### C. Update .env File
Open `.env` and add these lines at the top:

```env
# Email Configuration (Gmail SMTP)
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
```

Replace with your actual email and the password you just copied.

## Step 4: Restart Server (1 minute)

```bash
npm start
```

Look for:
```
🚀 Server running on port 3000
✅ Connected to database
```

## Step 5: Test It! (1 minute)

### Test Archive Feature
1. Log in as a teacher
2. Go to Classes page
3. Click gear icon on a class
4. Click "Archive Room"
5. Click "Archived Rooms" button
6. Click "Restore"
7. ✅ Should redirect to active classes

### Test Dual Notifications
1. Have a teacher kick a student
2. Check:
   - ✅ Student sees in-app notification
   - ✅ Student receives email (check inbox/spam)

## That's It! 🎉

You're now running with:
- ✅ Archive & Delete functionality
- ✅ Dedicated Archived Rooms page
- ✅ Student Leave/Archive controls
- ✅ Dual notifications (in-app + email)
- ✅ Professional email templates

## Quick Troubleshooting

### Database Migration Failed?
```bash
# Try manual migration
mysql -u root student_tracker < Database/archive_feature_update.sql
```

### Emails Not Sending?
1. Check spam folder first
2. Verify Gmail credentials in .env
3. Make sure you used app password (not regular password)
4. Check server logs for errors

### "Unarchive" Still Showing?
1. Clear browser cache (Ctrl+Shift+Delete)
2. Hard refresh (Ctrl+F5)

## Need More Help?

See detailed guides:
- `GMAIL_SETUP_GUIDE.md` - Gmail configuration
- `DUAL_NOTIFICATION_SYSTEM.md` - Email system details
- `ARCHIVE_FEATURE_IMPLEMENTATION.md` - Archive features
- `run_migration.md` - Database migration help

## What's New?

### For Teachers
- Archive classes (affects all users)
- Delete classes permanently
- Get email when students leave
- Approve/reject re-entry requests

### For Students
- Archive classes personally
- Leave classes
- Get emails for all actions
- Request re-entry after being kicked

### For Everyone
- Professional email notifications
- "Restore" button on archived page
- Better error handling
- Cleaner UI

## Success! ✨

If you see:
- ✅ Server running without errors
- ✅ Archive/restore working
- ✅ Emails arriving
- ✅ No console errors

You're all set! Enjoy your upgraded system! 🚀
