# AI Trust Layer & Privacy Implementation

## Overview

This implementation provides a privacy-first AI system for the TuttoPassa platform, featuring consent management, data anonymization, and secure AI-generated content storage.

## Features Implemented

### 1. Consent Management
- **AIConsent Model**: Tracks user consent for each AI feature
- **Granular Control**: Users can consent/revoke consent for specific features
- **Audit Trail**: Tracks when consent was given/revoked

### 2. Preference Management
- **AIPreference Model**: Stores user preferences for AI features
- **Feature-Specific Settings**: Each feature can have custom settings
- **Flexible Configuration**: JSON-based settings storage

### 3. Data Anonymization
- **Privacy-First**: All personal data is anonymized before AI processing
- **Reversible Mapping**: Maintains mapping for authorized access
- **Comprehensive Coverage**: Handles names, emails, usernames

### 4. AI-Generated Content Storage
- **AIGeneratedContent Model**: Stores all AI-generated content
- **Metadata Tracking**: Records prompts, models, settings used
- **Feedback System**: Users can provide feedback on AI outputs
- **Soft Delete**: Content can be deactivated without permanent deletion

### 5. Session Summaries
- **Automatic Generation**: AI creates session summaries with action items
- **Key Concepts Extraction**: Identifies important topics discussed
- **Next Steps**: Provides actionable next steps for students

### 6. AI Assistant
- **Chat Integration**: AI assistant for real-time help
- **Context Awareness**: Can reference session context
- **Educational Focus**: Tailored for tutoring scenarios

## Database Schema

### New Tables
- `ai_consents`: User consent tracking
- `ai_preferences`: User preference settings
- `ai_generated_content`: AI-generated content storage
- `session_summaries`: Session summary storage
- `session_transcripts`: Session transcript storage

### New Enums
- `AIFeature`: Available AI features
- `AIContentType`: Types of AI-generated content

## API Endpoints

### Consent Management
- `GET /api/ai/consents` - Get user consents
- `POST /api/ai/consents` - Set user consent

### Preference Management
- `GET /api/ai/preferences` - Get user preferences
- `POST /api/ai/preferences` - Set user preferences

### Session Summaries
- `POST /api/ai/sessions/:sessionId/summary` - Generate session summary
- `GET /api/ai/sessions/:sessionId/summary` - Get session summary

### AI Assistant
- `POST /api/ai/assistant` - Get AI response

### Content Management
- `GET /api/ai/content` - Get AI-generated content
- `POST /api/ai/content/:contentId/feedback` - Update content feedback

### Privacy & Compliance
- `GET /api/ai/privacy-report` - Get privacy report
- `DELETE /api/ai/user-data` - Delete user data

### Health Check
- `GET /api/ai/health` - Check AI service health

## Security Features

### Privacy Protection
- **Data Anonymization**: All personal data anonymized before AI processing
- **Consent Verification**: Every AI operation checks for user consent
- **Audit Trail**: Complete tracking of AI operations and data usage

### Compliance
- **GDPR Ready**: Right to be forgotten implemented
- **Data Minimization**: Only necessary data is processed
- **Transparency**: Users can see what data is used and how

## Usage Examples

### Setting Up AI Consent
```javascript
// User consents to session summaries
await AIService.setConsent(userId, 'SESSION_SUMMARY', true);

// Check if user has consented
const hasConsent = await AIService.checkConsent(userId, 'SESSION_SUMMARY');
```

### Generating Session Summary
```javascript
// Generate summary (requires consent)
const summary = await AIService.generateSessionSummary(sessionId, sessionData);
```

### Using AI Assistant
```javascript
// Get AI response (requires consent)
const response = await AIService.generateAIResponse(userId, message, context);
```

## Environment Variables

Add to your `.env` file:
```
OPENAI_API_KEY=your_openai_api_key_here
```

## Testing

Run the AI service test:
```bash
node test-ai.js
```

## Next Steps

1. **Frontend Integration**: Create UI components for consent management
2. **Real-time Features**: Implement transcription and smart notes
3. **Advanced Analytics**: Add engagement metrics and insights
4. **Content Recommendations**: Build recommendation engine
5. **Practice Generation**: Create AI-powered practice questions

## Security Considerations

- All AI operations require explicit user consent
- Personal data is anonymized before processing
- AI-generated content is clearly marked
- Users can delete their AI data at any time
- Complete audit trail for compliance

## Performance Notes

- OpenAI API calls are rate-limited and cached where possible
- Database queries are optimized with proper indexing
- Anonymization is done in-memory for performance
- Content storage uses soft deletes for data recovery 