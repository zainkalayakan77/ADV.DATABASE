# Dual Notification System Documentation

## Overview
The dual notification system sends notifications through two channels simultaneously:
1. **In-App Notifications** - Stored in database, visible in notification bell
2. **Email Notifications** - Sent to user's registered email via Gmail

## Architecture

### Components

1. **Email Service** (`Backend/services/emailService.js`)
   - Handles email sending via Nodemailer
   - Contains email templates
   - Manages dual notification logic

2. **Controllers** (Updated)
   - `memberController.js` - Kick, rejoin requests, approvals/rejections
   - `classController.js` - Archive, leave class actions

3. **Database**
   - `Notifications` table - Stores in-app notifications
   - User emails from `Users` table

## Notification Events

### 1. Student Kicked from Class

**Trigger:** Teacher kicks a student

**In-App Notification:**
- **Recipient:** Kicked student
- **Type:** system
- **Title:** "You have been removed from a class"
- **Message:** Class name + reason

**Email Notification:**
- **Template:** `studentKicked`
- **Contains:**
  - Class name
  - Teacher's name
  - Reason for removal
  - Class code (for rejoining)
  - Link to dashboard

### 2. Re-entry Request Submitted

**Trigger:** Kicked student requests to rejoin

**In-App Notification:**
- **Recipient:** All teachers in the class
- **Type:** join_request
- **Title:** "Join Request"
- **Message:** Student name + class name

**Email Notification:**
- **Template:** `rejoinRequest`
- **Contains:**
  - Student's name and email
  - Class name
  - Student's message (optional)
  - Link to review request

### 3. Request Approved

**Trigger:** Teacher approves rejoin request

**In-App Notification:**
- **Recipient:** Student who requested
- **Type:** system
- **Title:** "Request Approved"
- **Message:** Access granted to class

**Email Notification:**
- **Template:** `requestApproved`
- **Contains:**
  - Class name
  - Teacher's name
  - Link to class

### 4. Request Rejected

**Trigger:** Teacher rejects rejoin request

**In-App Notification:**
- **Recipient:** Student who requested
- **Type:** system
- **Title:** "Request Rejected"
- **Message:** Request declined + 24-hour cooldown

**Email Notification:**
- **Template:** `requestRejected`
- **Contains:**
  - Class name
  - Teacher's name
  - Reason (optional)
  - Link to dashboard

### 5. Class Archived by Teacher

**Trigger:** Teacher archives a class

**In-App Notification:**
- **Recipient:** All enrolled students
- **Type:** system
- **Title:** "Class Archived"
- **Message:** Class now in read-only mode

**Email Notification:**
- **Template:** `classArchived`
- **Contains:**
  - Class name
  - Teacher's name
  - Explanation of read-only mode
  - Link to archived rooms

### 6. Student Leaves Class

**Trigger:** Student leaves a class

**In-App Notification:**
- **Recipient:** All teachers in the class
- **Type:** system
- **Title:** "Student Left Class"
- **Message:** Student name + class name

**Email Notification:**
- **Template:** `studentLeft`
- **Contains:**
  - Student's name
  - Class name
  - Link to class

## Error Handling

### Graceful Degradation

The system is designed to continue working even if one channel fails:

```javascript
const results = {
    inApp: { success: false },
    email: { success: false }
};

// Try in-app notification
try {
    // Send in-app notification
    results.inApp = { success: true };
} catch (error) {
    console.error('In-app notification failed:', error);
    results.inApp = { success: false, error: error.message };
}

// Try email notification (independent of in-app)
try {
    // Send email
    results.email = { success: true };
} catch (error) {
    console.error('Email notification failed:', error);
    results.email = { success: false, error: error.message };
}

return results; // Both results logged
```

### Error Scenarios

1. **Email not configured**
   - In-app notification: ✅ Sent
   - Email: ⚠️ Skipped with warning
   - User experience: Unaffected

2. **Invalid email address**
   - In-app notification: ✅ Sent
   - Email: ❌ Failed (logged)
   - User experience: Gets in-app notification

3. **Gmail rate limit exceeded**
   - In-app notification: ✅ Sent
   - Email: ❌ Failed (logged)
   - User experience: Gets in-app notification

4. **Database error**
   - In-app notification: ❌ Failed
   - Email: ✅ Sent (if configured)
   - User experience: Gets email

## Email Templates

All email templates include:
- Professional HTML formatting
- Responsive design
- Clear call-to-action buttons
- Branding (Student Activity Tracker)
- Footer with disclaimer

### Template Structure

```html
<!DOCTYPE html>
<html>
<head>
    <style>
        /* Inline CSS for email compatibility */
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <!-- Colored header with icon -->
        </div>
        <div class="content">
            <!-- Main message -->
            <!-- Info boxes -->
            <!-- Call-to-action button -->
        </div>
        <div class="footer">
            <!-- System name -->
            <!-- Disclaimer -->
        </div>
    </div>
</body>
</html>
```

### Color Coding

- **Red (#f44336)** - Kicked, Rejected
- **Orange (#ff9800)** - Archived, Warnings
- **Green (#4caf50)** - Approved, Success
- **Blue (#1976d2)** - Information, Actions

## API Response Format

When dual notifications are sent, the response includes:

```json
{
    "message": "Action completed successfully",
    "notifications": {
        "inApp": {
            "success": true
        },
        "email": {
            "success": true,
            "messageId": "<unique-id@gmail.com>"
        }
    }
}
```

## Configuration

### Environment Variables

```env
# Required for email notifications
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password
SITE_URL=http://localhost:3000

# Optional
NODE_ENV=development
```

### Email Service Configuration

Located in `Backend/services/emailService.js`:

```javascript
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
    }
});
```

## Testing

### Manual Testing

1. **Test In-App Only** (without email configured):
   ```bash
   # Don't set GMAIL_USER and GMAIL_APP_PASSWORD
   node Backend/server.js
   ```
   - Perform actions
   - Check in-app notifications work
   - Verify console shows "Email not configured" warnings

2. **Test Both Channels**:
   ```bash
   # Set email credentials in .env
   node Backend/server.js
   ```
   - Perform actions
   - Check in-app notifications
   - Check email inbox
   - Verify both work independently

### Automated Testing

```javascript
// Test dual notification
const result = await sendDualNotification(
    {
        userId: 1,
        type: 'system',
        title: 'Test',
        message: 'Test message',
        relatedId: null
    },
    {
        to: 'test@example.com',
        template: 'studentKicked',
        data: { /* template data */ }
    }
);

console.log('In-app:', result.inApp.success);
console.log('Email:', result.email.success);
```

## Monitoring

### Logging

All notification attempts are logged:

```
✅ In-app notification sent
✅ Email sent: <message-id>
❌ Email send error: [error message]
⚠️  Email not configured - skipping email notification
```

### Recommended Monitoring

1. **Track notification success rates**
   ```sql
   SELECT 
       COUNT(*) as total_notifications,
       SUM(CASE WHEN is_read = 1 THEN 1 ELSE 0 END) as read_count
   FROM Notifications
   WHERE created_at > DATE_SUB(NOW(), INTERVAL 7 DAY);
   ```

2. **Monitor email failures**
   - Set up error logging service (e.g., Sentry)
   - Track failed email attempts
   - Alert on high failure rates

3. **Check Gmail quota**
   - Monitor daily email count
   - Alert when approaching limit (500/day)

## Best Practices

1. **Always use dual notifications for critical actions**
   - Kicks
   - Approvals/Rejections
   - Archive operations

2. **Keep email templates concise**
   - Clear subject lines
   - Brief, actionable content
   - Single call-to-action

3. **Handle errors gracefully**
   - Never block user actions due to notification failures
   - Log all errors for debugging
   - Provide fallback mechanisms

4. **Test email rendering**
   - Test in multiple email clients
   - Check mobile responsiveness
   - Verify links work correctly

5. **Respect user preferences** (future enhancement)
   - Allow users to opt-out of emails
   - Provide notification settings
   - Honor do-not-disturb periods

## Future Enhancements

1. **Notification Preferences**
   - User settings for email frequency
   - Digest mode (daily summary)
   - Channel preferences per event type

2. **Additional Channels**
   - SMS notifications
   - Push notifications (mobile app)
   - Slack/Discord integration

3. **Rich Notifications**
   - Inline actions (approve/reject from email)
   - Attachments (reports, certificates)
   - Calendar invites

4. **Analytics**
   - Email open rates
   - Click-through rates
   - Notification engagement metrics

## Troubleshooting

### Common Issues

1. **Emails going to spam**
   - Add SPF/DKIM records
   - Use dedicated sending domain
   - Avoid spam trigger words

2. **Slow email sending**
   - Implement queue system (Bull, RabbitMQ)
   - Send emails asynchronously
   - Batch notifications

3. **Template rendering issues**
   - Test with Email on Acid or Litmus
   - Use inline CSS only
   - Avoid complex layouts

## Support

For issues or questions:
1. Check server logs for errors
2. Verify email configuration
3. Test with simple notification first
4. Review Gmail setup guide
5. Check notification table in database
