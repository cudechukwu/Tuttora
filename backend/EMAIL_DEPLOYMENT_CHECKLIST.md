# Email Notification System - Deployment Checklist

## Pre-Deployment

### 1. Environment Setup
- [ ] SendGrid account created
- [ ] API key generated and secured
- [ ] Sender email verified
- [ ] Environment variables configured
- [ ] Frontend URL set correctly

### 2. Database
- [ ] Prisma migration run: `npm run db:migrate`
- [ ] New tables created: `notification_preferences`, `email_logs`
- [ ] Database connection tested

### 3. Dependencies
- [ ] `@sendgrid/mail` installed
- [ ] `date-fns` installed
- [ ] All packages built: `npm run build`

### 4. Testing
- [ ] Email service unit tests pass
- [ ] Notification service integration tested
- [ ] Email templates render correctly
- [ ] Rate limiting logic verified

## Deployment Steps

### 1. Backend Deployment
- [ ] Code deployed to staging/production
- [ ] Environment variables set on server
- [ ] Database migration run on production
- [ ] Server restarted

### 2. SendGrid Configuration
- [ ] Production API key configured
- [ ] Sender domain verified
- [ ] Webhook endpoints configured (if using)
- [ ] Rate limits checked

### 3. Monitoring Setup
- [ ] Email logs table accessible
- [ ] SendGrid dashboard monitoring enabled
- [ ] Error alerting configured
- [ ] Performance metrics tracked

## Post-Deployment Verification

### 1. Functional Testing
- [ ] Create new session request
- [ ] Verify tutor receives email
- [ ] Accept session request
- [ ] Verify rookie receives email
- [ ] Check email logs in database

### 2. Rate Limiting
- [ ] Test rate limiting (2 emails per 10 min)
- [ ] Verify digest queuing works
- [ ] Check account-wide limits (20/min)

### 3. Error Handling
- [ ] Test with invalid email addresses
- [ ] Verify retry logic works
- [ ] Check error logging

### 4. Performance
- [ ] Email delivery time < 30 seconds
- [ ] No impact on request creation/acceptance
- [ ] Database performance maintained

## Rollback Plan

### If Issues Occur
1. **Immediate**: Disable email notifications in environment
2. **Short-term**: Revert to previous version
3. **Investigation**: Check logs and SendGrid dashboard
4. **Fix**: Resolve issues and redeploy

### Rollback Commands
```bash
# Disable email notifications
export SENDGRID_API_KEY=""

# Restart application
pm2 restart app

# Check logs
tail -f logs/app.log
```

## Monitoring & Alerts

### Key Metrics
- Email delivery rate
- Bounce rate
- Spam complaints
- API response times
- Database query performance

### Alert Thresholds
- Delivery rate < 95%
- Bounce rate > 2%
- Error rate > 5%
- Response time > 5 seconds

### Daily Checks
- Email log review
- SendGrid dashboard
- Error rate monitoring
- Performance metrics

## Support Contacts

### Development Team
- Primary: [Your Name]
- Backup: [Backup Developer]

### SendGrid Support
- Account: [Account Details]
- Support Portal: [URL]

### Infrastructure
- Server Admin: [Admin Contact]
- Database Admin: [DB Contact]

## Success Criteria

### Week 1
- [ ] 95%+ email delivery rate
- [ ] < 2% bounce rate
- [ ] No critical errors
- [ ] User feedback positive

### Month 1
- [ ] 98%+ email delivery rate
- [ ] < 1% bounce rate
- [ ] Improved user engagement
- [ ] No performance degradation

### Ongoing
- [ ] Monthly delivery rate review
- [ ] Quarterly performance optimization
- [ ] User preference analysis
- [ ] Template A/B testing
