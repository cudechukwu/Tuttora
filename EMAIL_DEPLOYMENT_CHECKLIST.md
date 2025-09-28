# 📧 Email Notifications Deployment Checklist

## ✅ **Pre-Deployment Checklist**

### **1. Environment Variables**
- [ ] `SMTP_HOST` - Email server (e.g., smtp.gmail.com)
- [ ] `SMTP_PORT` - Port number (usually 587)
- [ ] `SMTP_SECURE` - Set to "false" for most providers
- [ ] `SMTP_USER` - Your email address
- [ ] `SMTP_PASS` - App password (NOT your regular password)

### **2. Email Provider Setup**
- [ ] Gmail: 2FA enabled + App Password generated
- [ ] Outlook: App Password configured
- [ ] Other: SMTP settings verified

### **3. Local Testing**
- [ ] Test script runs successfully: `npx ts-node scripts/test-email-notifications.ts`
- [ ] Received test emails in inbox
- [ ] Admin account has `isAdmin: true` in database

### **4. Code Integration**
- [ ] Email service imported in controllers
- [ ] Registration notifications added
- [ ] Session request notifications added
- [ ] Session acceptance notifications added
- [ ] Session completion notifications added

## 🚀 **Deployment Steps**

### **Railway Deployment**
```bash
# Set environment variables in Railway dashboard
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Deploy
railway up
```

### **Vercel Deployment**
```bash
# Set in Vercel dashboard: Settings → Environment Variables
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Deploy
vercel --prod
```

### **Heroku Deployment**
```bash
# Set config vars
heroku config:set SMTP_HOST=smtp.gmail.com
heroku config:set SMTP_PORT=587
heroku config:set SMTP_SECURE=false
heroku config:set SMTP_USER=your-email@gmail.com
heroku config:set SMTP_PASS=your-app-password

# Deploy
git push heroku main
```

## 🧪 **Post-Deployment Testing**

### **1. Test User Registration**
- [ ] Register a new test user
- [ ] Check if registration email arrived
- [ ] Verify email content and formatting

### **2. Test Session Flow**
- [ ] Create session request (as rookie)
- [ ] Check session request email
- [ ] Accept session (as tutor)
- [ ] Check session acceptance email
- [ ] Complete session
- [ ] Check session completion email

### **3. Verify Admin Access**
- [ ] Only admin users receive notifications
- [ ] Non-admin users don't trigger notifications to themselves
- [ ] Multiple admins all receive notifications

## 📊 **Monitoring & Maintenance**

### **Check Email Service Status**
```bash
# View server logs for email-related messages
# Look for these success messages:
# ✅ Email service initialized successfully
# 📧 Loaded X admin email(s) for notifications
# ✅ Admin notification sent: [subject]

# Look for these error messages:
# ⚠️ Email credentials not configured
# ❌ Failed to send admin notification
```

### **Common Production Issues**

**Issue: "Email notifications not configured"**
- Solution: Verify environment variables are set in deployment platform
- Check: Variables are not wrapped in quotes in some platforms

**Issue: "SMTP connection failed"**
- Solution: Check SMTP settings for your provider
- Verify: Network/firewall allows outbound SMTP connections

**Issue: "No admin emails found"**
- Solution: Ensure at least one user has `isAdmin: true`
- Run: Admin management script to grant admin access

### **Performance Notes**
- Email sending is asynchronous and won't block user actions
- Failed emails are logged but don't affect app functionality
- SMTP connection is reused for efficiency

## 🔧 **Quick Commands**

```bash
# Test email service
npx ts-node scripts/test-email-notifications.ts

# Check admin users
npx ts-node scripts/manage-admins.ts list

# Grant admin access
npx ts-node scripts/manage-admins.ts grant admin@example.com

# View user analytics
npx ts-node scripts/check-user-analytics.ts
```

## ✅ **Success Criteria**

Your email notifications are working correctly when:
- [ ] Server starts with "Email service initialized successfully"
- [ ] Test script sends emails without errors
- [ ] New user registrations trigger emails
- [ ] Session requests send immediate notifications
- [ ] Session acceptances notify admin
- [ ] Session completions send summary emails
- [ ] Only admin users receive notifications
- [ ] Emails have proper HTML formatting and branding

---

**🎉 Once all items are checked, your admin email notifications are fully deployed and operational!**

