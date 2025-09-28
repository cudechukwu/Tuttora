# 📧 Admin Email Notifications Setup Guide

## 🎯 **What You'll Get**

You'll receive instant email notifications for:
- 🎉 **New User Registrations** - When someone joins TuttoPassa
- 📝 **Session Requests** - When a student requests help
- ✅ **Session Acceptances** - When a tutor accepts a session
- 🎯 **Session Completions** - When tutoring sessions end

## 🔧 **Setup Instructions**

### **Step 1: Configure Email Credentials**

1. **For Gmail (Recommended):**
   - Go to your Google Account settings
   - Enable 2-Factor Authentication
   - Generate an "App Password" for TuttoPassa
   - Use this app password, not your regular Gmail password

2. **Update your `.env` file:**
   ```bash
   # Add these to your backend/.env file
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT="587"
   SMTP_SECURE="false"
   SMTP_USER="your-email@gmail.com"
   SMTP_PASS="your-16-character-app-password"
   ```

3. **For other email providers:**
   ```bash
   # Outlook/Hotmail
   SMTP_HOST="smtp-mail.outlook.com"
   SMTP_PORT="587"
   
   # Yahoo
   SMTP_HOST="smtp.mail.yahoo.com"
   SMTP_PORT="587"
   
   # Custom SMTP
   SMTP_HOST="your-smtp-server.com"
   SMTP_PORT="587"
   ```

### **Step 2: Test Email Notifications**

Run the test script to verify everything works:

```bash
cd backend
npx ts-node scripts/test-email-notifications.ts
```

This will:
- ✅ Test SMTP connection
- ✅ Send a test notification to your admin email
- ✅ Verify email service is working

### **Step 3: Restart Your Server**

After adding email credentials, restart your backend:

```bash
cd backend
npm run dev  # or npm start for production
```

You should see:
```
✅ Email service initialized successfully
📧 Loaded 1 admin email(s) for notifications
```

## 📧 **Email Templates**

### **New User Registration**
- **Subject:** 🎉 New User Registration - [Name]
- **Content:** User details, role, university
- **Trigger:** When someone completes registration

### **Session Request**
- **Subject:** 📝 New Session Request - [Student Name]
- **Content:** Student info, course details, urgency level
- **Trigger:** When a student requests tutoring help

### **Session Acceptance**
- **Subject:** ✅ Session Accepted - [Tutor Name]
- **Content:** Tutor info, session details
- **Trigger:** When a tutor accepts a session

### **Session Completion**
- **Subject:** 🎯 Session Completed - [Participant Name]
- **Content:** Session summary, duration, participants
- **Trigger:** When a tutoring session ends

## 🛠️ **Troubleshooting**

### **"Email notifications not configured" message**
- Check your `.env` file has `SMTP_USER` and `SMTP_PASS`
- Restart your backend server
- Verify credentials are correct

### **"Failed to send email" errors**
- Verify SMTP settings for your email provider
- Check if 2FA is enabled (required for Gmail)
- Ensure app password is used, not regular password
- Check firewall/network restrictions

### **Gmail-specific issues**
- Enable 2-Factor Authentication
- Generate App Password: Google Account → Security → App Passwords
- Use the 16-character app password, not your Gmail password

### **Not receiving emails**
- Check spam/junk folder
- Verify admin email is correct in database
- Test SMTP connection with the test script

## 🔄 **Managing Admin Notifications**

### **Add/Remove Admin Recipients**
```bash
# List current admins receiving notifications
npx ts-node scripts/manage-admins.ts list

# Add new admin (they'll get notifications)
npx ts-node scripts/manage-admins.ts grant admin@example.com

# Remove admin access (stops notifications)
npx ts-node scripts/manage-admins.ts revoke admin@example.com
```

### **Disable Email Notifications**
To temporarily disable notifications, remove or comment out the SMTP credentials in your `.env` file:

```bash
# SMTP_USER="your-email@gmail.com"
# SMTP_PASS="your-app-password"
```

## 📊 **Testing & Verification**

### **Test Commands**
```bash
# Test email service
npx ts-node scripts/test-email-notifications.ts

# Check current admin emails
npx ts-node scripts/manage-admins.ts list

# View recent user activity
npx ts-node scripts/check-user-analytics.ts
```

### **Production Deployment**
Make sure to set environment variables in your deployment platform:
- **Railway:** Add SMTP variables in Settings → Variables
- **Heroku:** Use `heroku config:set SMTP_USER=...`
- **Vercel:** Add in Project Settings → Environment Variables

## 🚀 **You're All Set!**

Once configured, you'll receive beautiful HTML emails instantly when:
- ✅ New users join your platform
- ✅ Students request tutoring sessions
- ✅ Tutors accept session requests
- ✅ Tutoring sessions are completed

The system is designed to never fail user actions if email fails - it will log the error but continue processing normally.

---

**Need help?** Check the logs for email-related messages or run the test script to diagnose issues.

