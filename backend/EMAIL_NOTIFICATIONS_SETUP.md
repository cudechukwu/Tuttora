# Email Notification System Setup

This document explains how to set up and use the email notification system for TuttoPassa.

## Overview

The email notification system automatically sends emails to:
- **Tutors** when a new request matches their skills
- **Rookies** when their request is accepted by a tutor

## Features

- **Rate Limiting**: Max 2 emails per tutor per 10 minutes
- **Quiet Hours**: Respects user's quiet hours preferences
- **Digest Support**: Groups multiple requests when rate limit is hit
- **Error Handling**: 3 retry attempts with exponential backoff
- **Logging**: Tracks all email attempts and failures

## Setup

### 1. Environment Variables

Add these to your `.env` file:

```bash
# Email Notifications (SendGrid)
SENDGRID_API_KEY="your_sendgrid_api_key_here"
SENDGRID_FROM_EMAIL="noreply@tuttopassa.com"
FRONTEND_URL="http://localhost:3000"  # or your production URL
```

### 2. SendGrid Setup

1. Create a SendGrid account at [sendgrid.com](https://sendgrid.com)
2. Get your API key from Settings > API Keys
3. Verify your sender domain or use a single sender verification
4. Set the `SENDGRID_FROM_EMAIL` to your verified sender

### 3. Install Dependencies

```bash
npm install @sendgrid/mail date-fns
```

### 4. Database Migration

Run the Prisma migration to create the new tables:

```bash
npm run db:migrate
```

## Database Schema

### NotificationPreference Table

```sql
CREATE TABLE notification_preferences (
  id TEXT PRIMARY KEY,
  userId TEXT UNIQUE NOT NULL,
  emailNewRequest BOOLEAN DEFAULT true,
  emailRequestAccepted BOOLEAN DEFAULT true,
  quietHoursStart TEXT, -- Format: "HH:MM"
  quietHoursEnd TEXT,   -- Format: "HH:MM"
  digestFrequency TEXT DEFAULT 'immediate',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### EmailLog Table

```sql
CREATE TABLE email_logs (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  type TEXT NOT NULL, -- "new_request", "request_accepted", "digest"
  requestId TEXT,
  status TEXT NOT NULL, -- "pending", "sent", "failed", "bounced", "complained"
  providerMessageId TEXT,
  error TEXT,
  attempts INTEGER DEFAULT 0,
  nextRetryAt TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Usage

### Automatic Notifications

The system automatically sends notifications when:

1. **New Request Created**: `createSessionRequest()` calls `notifyTutorsOfNewRequest()`
2. **Request Accepted**: `acceptSessionRequest()` calls `notifyRookieOfAcceptedRequest()`

### Manual Notifications

You can also trigger notifications manually:

```typescript
import { notificationService } from '../services/notificationService';

// Notify tutors of new request
await notificationService.notifyTutorsOfNewRequest(requestId);

// Notify rookie of accepted request
await notificationService.notifyRookieOfAcceptedRequest(requestId, tutorId);
```

## Email Templates

### New Request Email (to Tutors)

**Subject**: `New request you qualify for: {CourseCode} • {Topic} • {When}`

**Content**:
- Course code and topic
- Problem summary (first 200 chars)
- Estimated time commitment
- Rookie level
- Credits/payout
- Requested time
- CTA: "Review & Accept"

### Request Accepted Email (to Rookies)

**Subject**: `{TutorName} accepted your request 🎉`

**Content**:
- Tutor name and profile link
- Proposed time
- Scheduling link
- Next steps
- CTA: "Open Your Request"

## Rate Limiting

- **Per Tutor**: Max 2 "new request" emails per 10 minutes
- **Per Rookie**: Max 2 "request accepted" emails per 10 minutes
- **Account-wide**: Max 20 emails per minute
- **Overflow**: Excess emails are queued for digest

## Quiet Hours

Users can set quiet hours in their profile:
- Emails are queued during quiet hours
- Sent automatically when quiet hours end
- No overrides for v1 (keeps it simple)

## Error Handling

- **Retries**: 3 attempts with exponential backoff (1min, 5min, 30min)
- **Logging**: All attempts logged to EmailLog table
- **Bounces**: Bounced addresses marked as suppressed
- **Monitoring**: Alerts sent to Sentry for high failure rates

## Testing

### Test Script

Run the test script to verify the system:

```bash
node test-email-notifications.js
```

### SendGrid Sandbox

- Use SendGrid sandbox mode for development
- Emails won't actually be sent
- Check SendGrid dashboard for delivery status

### Local Testing

For local development, consider using:
- **Mailtrap**: Catches emails for inspection
- **Ethereal**: Creates fake SMTP server

## Monitoring

### Email Logs

Check the `email_logs` table for:
- Delivery status
- Error messages
- Retry attempts
- Provider message IDs

### SendGrid Dashboard

Monitor:
- Delivery rates
- Bounce rates
- Spam reports
- API usage

## Future Enhancements

- **AWS SES Migration**: Easy provider switching
- **Digest Emails**: Daily/weekly summaries
- **Advanced Scheduling**: Timezone-aware quiet hours
- **Template Customization**: User-configurable templates
- **A/B Testing**: Test different email formats

## Troubleshooting

### Common Issues

1. **API Key Invalid**: Check SendGrid API key in environment
2. **Sender Not Verified**: Verify sender email in SendGrid
3. **Rate Limited**: Check SendGrid account limits
4. **Database Errors**: Ensure migration ran successfully

### Debug Mode

Enable debug logging by setting:

```bash
DEBUG=email:*
```

### Support

For issues:
1. Check email logs in database
2. Verify SendGrid dashboard
3. Check application logs
4. Contact development team

## Security

- API keys stored in environment variables
- No sensitive data in email templates
- Rate limiting prevents abuse
- Bounce handling maintains sender reputation
