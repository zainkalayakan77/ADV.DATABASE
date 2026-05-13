# Gmail Setup Guide for Dual Notification System

## Overview
This guide will help you set up Gmail integration for the dual notification system (In-App + Email).

## Prerequisites
- A Gmail account
- Node.js project with nodemailer installed

## Step 1: Install Nodemailer

Run this command in your project directory:

```bash
npm install nodemailer
```

## Step 2: Enable 2-Factor Authentication on Gmail

1. Go to your Google Account: https://myaccount.google.com/
2. Click on "Security" in the left sidebar
3. Under "Signing in to Google", click on "2-Step Verification"
4. Follow the prompts to enable 2FA

## Step 3: Generate App Password

1. After enabling 2FA, go back to Security settings
2. Under "Signing in to Google", click on "App passwords"
3. Select "Mail" as the app
4. Select "Other (Custom name)" as the device
5. Enter "Student Activity Tracker" as the name
6. Click "Generate"
7. **Copy the 16-character password** (you won't see it again!)

## Step 4: Update .env File

Add these lines to your `.env` file:

```env
# Email Configuration (Gmail)
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
SITE_URL=http://localhost:3000
```

**Replace:**
- `your-email@gmail.com` with your actual Gmail address
- `xxxx xxxx xxxx xxxx` with the 16-character app password from Step 3
- `http://localhost:3000` with your actual site URL (in production)

**Example:**
```env
GMAIL_USER=teacher@gmail.com
GMAIL_APP_PASSWORD=abcd efgh ijkl mnop
SITE_URL=https://myschool.com
```

## Step 5: Restart Your Server

After updating the .env file, restart your Node.js server:

```bash
# Stop the server (Ctrl+C)
# Then start it again
node Backend/server.js
```

## Step 6: Test the Email System

1. Log in as a teacher
2. Kick a student from a class
3. Check if:
   - The student receives an in-app notification
   - The student receives an email at their registered email address

## Troubleshooting

### Error: "Invalid login"
- Make sure you've enabled 2-Factor Authentication
- Verify the app password is correct (no spaces)
- Check that GMAIL_USER matches the account that generated the app password

### Error: "Connection timeout"
- Check your internet connection
- Verify firewall isn't blocking port 587 or 465
- Try using a different network

### Emails not sending but no errors
- Check the spam/junk folder
- Verify the recipient email address is correct in the database
- Check Gmail's "Sent" folder to confirm emails are being sent

### "Email not configured" warning
- Make sure GMAIL_USER and GMAIL_APP_PASSWORD are set in .env
- Restart the server after adding environment variables
- Check for typos in variable names

## Security Best Practices

1. **Never commit .env file to Git**
   - Add `.env` to your `.gitignore` file
   
2. **Use different credentials for production**
   - Create a dedicated email account for production
   - Don't use personal Gmail accounts

3. **Rotate app passwords regularly**
   - Generate new app passwords every few months
   - Revoke old passwords from Google Account settings

4. **Monitor email usage**
   - Gmail has sending limits (500 emails/day for free accounts)
   - Consider using a dedicated email service for high volume

## Gmail Sending Limits

- **Free Gmail**: 500 emails per day
- **Google Workspace**: 2,000 emails per day

If you exceed these limits, consider:
- SendGrid (free tier: 100 emails/day)
- Mailgun (free tier: 5,000 emails/month)
- AWS SES (pay-as-you-go)

## Alternative Email Services

If you prefer not to use Gmail, you can modify the email service to use:

### SendGrid
```javascript
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
```

### Mailgun
```javascript
const mailgun = require('mailgun-js')({
    apiKey: process.env.MAILGUN_API_KEY,
    domain: process.env.MAILGUN_DOMAIN
});
```

### AWS SES
```javascript
const AWS = require('aws-sdk');
const ses = new AWS.SES({
    region: process.env.AWS_REGION
});
```

## Testing Email Templates

To test email templates without sending actual emails, you can use:

1. **Mailtrap** (https://mailtrap.io/) - Email testing service
2. **Ethereal Email** (https://ethereal.email/) - Fake SMTP service

Update your .env for testing:
```env
GMAIL_USER=your-ethereal-username
GMAIL_APP_PASSWORD=your-ethereal-password
```

## Support

If you encounter issues:
1. Check the server console for error messages
2. Verify all environment variables are set correctly
3. Test with a simple email first
4. Check Gmail's security settings

## Production Checklist

Before deploying to production:

- [ ] Created dedicated Gmail account for the application
- [ ] Enabled 2-Factor Authentication
- [ ] Generated app password
- [ ] Updated .env with production credentials
- [ ] Updated SITE_URL to production domain
- [ ] Tested email sending in production environment
- [ ] Set up email monitoring/logging
- [ ] Configured error alerts for failed emails
- [ ] Verified email templates display correctly
- [ ] Checked spam score of emails
- [ ] Documented email credentials securely
