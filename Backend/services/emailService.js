// Email Service - Gmail Integration using Nodemailer
const nodemailer = require('nodemailer');

// Create reusable transporter
let transporter = null;

const initializeTransporter = () => {
    if (!transporter) {
        transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_APP_PASSWORD
            }
        });
    }
    return transporter;
};

// Email templates
const emailTemplates = {
    studentKicked: (data) => ({
        subject: `You have been removed from ${data.className}`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #f44336; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
                    .reason-box { background: white; padding: 15px; margin: 20px 0; border-left: 4px solid #f44336; }
                    .button { display: inline-block; padding: 12px 30px; background: #1976d2; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
                    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Class Removal Notice</h1>
                    </div>
                    <div class="content">
                        <p>Hello ${data.studentName},</p>
                        <p>You have been removed from the class <strong>${data.className}</strong> by ${data.teacherName}.</p>
                        
                        <div class="reason-box">
                            <strong>Reason:</strong>
                            <p>${data.reason || 'No reason provided'}</p>
                        </div>
                        
                        <p>If you believe this was a mistake or would like to discuss this decision, please contact your teacher directly.</p>
                        
                        <p>You can request to rejoin the class by using the class code: <strong>${data.classCode}</strong></p>
                        
                        <a href="${data.siteUrl}" class="button">Go to Dashboard</a>
                    </div>
                    <div class="footer">
                        <p>Student Activity Tracker System</p>
                        <p>This is an automated message, please do not reply to this email.</p>
                    </div>
                </div>
            </body>
            </html>
        `
    }),

    rejoinRequest: (data) => ({
        subject: `Re-entry Request from ${data.studentName} for ${data.className}`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #ff9800; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
                    .info-box { background: white; padding: 15px; margin: 20px 0; border-left: 4px solid #ff9800; }
                    .button { display: inline-block; padding: 12px 30px; background: #1976d2; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
                    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Re-entry Request Pending</h1>
                    </div>
                    <div class="content">
                        <p>Hello ${data.teacherName},</p>
                        <p><strong>${data.studentName}</strong> has requested to rejoin your class <strong>${data.className}</strong>.</p>
                        
                        ${data.message ? `
                        <div class="info-box">
                            <strong>Student's Message:</strong>
                            <p>${data.message}</p>
                        </div>
                        ` : ''}
                        
                        <p>Please review this request in your notifications panel and decide whether to approve or reject it.</p>
                        
                        <a href="${data.siteUrl}" class="button">Review Request</a>
                    </div>
                    <div class="footer">
                        <p>Student Activity Tracker System</p>
                        <p>This is an automated message, please do not reply to this email.</p>
                    </div>
                </div>
            </body>
            </html>
        `
    }),

    requestApproved: (data) => ({
        subject: `Your request to rejoin ${data.className} has been approved`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #4caf50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
                    .button { display: inline-block; padding: 12px 30px; background: #1976d2; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
                    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>✓ Request Approved</h1>
                    </div>
                    <div class="content">
                        <p>Hello ${data.studentName},</p>
                        <p>Great news! Your request to rejoin <strong>${data.className}</strong> has been approved by ${data.teacherName}.</p>
                        
                        <p>You can now access the class and participate in all activities.</p>
                        
                        <a href="${data.siteUrl}" class="button">Go to Class</a>
                    </div>
                    <div class="footer">
                        <p>Student Activity Tracker System</p>
                        <p>This is an automated message, please do not reply to this email.</p>
                    </div>
                </div>
            </body>
            </html>
        `
    }),

    requestRejected: (data) => ({
        subject: `Your request to rejoin ${data.className} has been declined`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #f44336; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
                    .button { display: inline-block; padding: 12px 30px; background: #1976d2; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
                    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Request Declined</h1>
                    </div>
                    <div class="content">
                        <p>Hello ${data.studentName},</p>
                        <p>Your request to rejoin <strong>${data.className}</strong> has been declined by ${data.teacherName}.</p>
                        
                        ${data.reason ? `<p><strong>Reason:</strong> ${data.reason}</p>` : ''}
                        
                        <p>If you have questions about this decision, please contact your teacher directly.</p>
                        
                        <a href="${data.siteUrl}" class="button">Go to Dashboard</a>
                    </div>
                    <div class="footer">
                        <p>Student Activity Tracker System</p>
                        <p>This is an automated message, please do not reply to this email.</p>
                    </div>
                </div>
            </body>
            </html>
        `
    }),

    classArchived: (data) => ({
        subject: `${data.className} has been archived`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #ff9800; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
                    .info-box { background: #fff3cd; padding: 15px; margin: 20px 0; border-left: 4px solid #ff9800; }
                    .button { display: inline-block; padding: 12px 30px; background: #1976d2; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
                    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Class Archived</h1>
                    </div>
                    <div class="content">
                        <p>Hello ${data.studentName},</p>
                        <p>The class <strong>${data.className}</strong> has been archived by ${data.teacherName}.</p>
                        
                        <div class="info-box">
                            <strong>What does this mean?</strong>
                            <ul>
                                <li>The class is now in <strong>Read-Only</strong> mode</li>
                                <li>You can still view all materials, grades, and activities</li>
                                <li>You cannot submit new work or post comments</li>
                                <li>Find it in the "Archived Rooms" section of your dashboard</li>
                            </ul>
                        </div>
                        
                        <p>All your previous work and grades remain accessible for your records.</p>
                        
                        <a href="${data.siteUrl}" class="button">View Archived Rooms</a>
                    </div>
                    <div class="footer">
                        <p>Student Activity Tracker System</p>
                        <p>This is an automated message, please do not reply to this email.</p>
                    </div>
                </div>
            </body>
            </html>
        `
    }),

    studentLeft: (data) => ({
        subject: `${data.studentName} has left ${data.className}`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #1976d2; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
                    .button { display: inline-block; padding: 12px 30px; background: #1976d2; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
                    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Student Left Class</h1>
                    </div>
                    <div class="content">
                        <p>Hello ${data.teacherName},</p>
                        <p><strong>${data.studentName}</strong> has left your class <strong>${data.className}</strong>.</p>
                        
                        <p>The student is no longer enrolled and will not have access to class materials or activities.</p>
                        
                        <a href="${data.siteUrl}" class="button">View Class</a>
                    </div>
                    <div class="footer">
                        <p>Student Activity Tracker System</p>
                        <p>This is an automated message, please do not reply to this email.</p>
                    </div>
                </div>
            </body>
            </html>
        `
    }),

    activityUpdated: (data) => ({
        subject: `Update: ${data.activityTitle} has been edited`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #ff9800; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
                    .info-box { background: #fff3cd; padding: 15px; margin: 20px 0; border-left: 4px solid #ff9800; }
                    .button { display: inline-block; padding: 12px 30px; background: #1976d2; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
                    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Activity Updated</h1>
                    </div>
                    <div class="content">
                        <p>Hello ${data.studentName},</p>
                        <p>Your teacher <strong>${data.teacherName}</strong> has edited the activity <strong>"${data.activityTitle}"</strong>.</p>
                        
                        <div class="info-box">
                            <strong>What changed:</strong>
                            <p>${data.changeDescription}</p>
                        </div>
                        
                        <p>Please review the updated activity to ensure you're working with the latest information.</p>
                        
                        <a href="${data.siteUrl}" class="button">View Activity</a>
                    </div>
                    <div class="footer">
                        <p>Student Activity Tracker System</p>
                        <p>This is an automated message, please do not reply to this email.</p>
                    </div>
                </div>
            </body>
            </html>
        `
    })
};

// Send email function with error handling
const sendEmail = async (to, templateName, data) => {
    try {
        // Check if email is configured
        if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
            console.warn('⚠️  Email not configured - skipping email notification');
            return { success: false, error: 'Email not configured' };
        }

        const transport = initializeTransporter();
        const template = emailTemplates[templateName](data);

        const mailOptions = {
            from: `"Student Activity Tracker" <${process.env.GMAIL_USER}>`,
            to: to,
            subject: template.subject,
            html: template.html
        };

        const info = await transport.sendMail(mailOptions);
        console.log('✅ Email sent:', info.messageId);
        return { success: true, messageId: info.messageId };

    } catch (error) {
        console.error('❌ Email send error:', error.message);
        return { success: false, error: error.message };
    }
};

// Dual notification function - sends both in-app and email
const sendDualNotification = async (inAppData, emailData) => {
    const results = {
        inApp: { success: false },
        email: { success: false }
    };

    try {
        // Send in-app notification
        if (inAppData) {
            const { pool } = require('../config/database');
            await pool.execute(
                'INSERT INTO Notifications (user_id, type, title, message, related_id) VALUES (?, ?, ?, ?, ?)',
                [
                    inAppData.userId,
                    inAppData.type,
                    inAppData.title,
                    inAppData.message,
                    inAppData.relatedId || null
                ]
            );
            results.inApp = { success: true };
            console.log('✅ In-app notification sent');
        }
    } catch (error) {
        console.error('❌ In-app notification error:', error.message);
        results.inApp = { success: false, error: error.message };
    }

    try {
        // Send email notification
        if (emailData) {
            results.email = await sendEmail(
                emailData.to,
                emailData.template,
                emailData.data
            );
        }
    } catch (error) {
        console.error('❌ Email notification error:', error.message);
        results.email = { success: false, error: error.message };
    }

    return results;
};

module.exports = {
    sendEmail,
    sendDualNotification,
    emailTemplates
};
