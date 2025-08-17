import express from 'express';
import { AIService } from '../services/aiService';
import { authenticateToken } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';

const router = express.Router();
const prisma = new PrismaClient();

// Initialize OpenAI client (optional for demo)
let openai: OpenAI | null = null;
try {
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
} catch (error) {
  console.warn('OpenAI client not initialized - API key missing');
}

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Type guard for req.user
const getUser = (req: any) => {
  if (!req.user) {
    throw new Error('User not authenticated');
  }
  return req.user;
};

// Consent Management
router.get('/consents', async (req, res) => {
  try {
    const user = getUser(req);
    const consents = await AIService.getConsents(user.id);
    res.json(consents);
  } catch (error) {
    console.error('Error fetching consents:', error);
    res.status(500).json({ error: 'Failed to fetch consents' });
  }
});

router.post('/consents', async (req, res) => {
  try {
    const user = getUser(req);
    const { feature, consented } = req.body;

    if (!feature || typeof consented !== 'boolean') {
      return res.status(400).json({ error: 'Feature and consented are required' });
    }

    await AIService.setConsent(user.id, feature, consented);
    res.json({ message: 'Consent updated successfully' });
  } catch (error) {
    console.error('Error setting consent:', error);
    res.status(500).json({ error: 'Failed to set consent' });
  }
});

// Preference Management
router.get('/preferences', async (req, res) => {
  try {
    const user = getUser(req);
    const preferences = await AIService.getPreferences(user.id);
    res.json(preferences);
  } catch (error) {
    console.error('Error fetching preferences:', error);
    res.status(500).json({ error: 'Failed to fetch preferences' });
  }
});

router.post('/preferences', async (req, res) => {
  try {
    const user = getUser(req);
    const { feature, enabled, settings } = req.body;

    if (!feature || typeof enabled !== 'boolean') {
      return res.status(400).json({ error: 'Feature and enabled are required' });
    }

    await AIService.setPreference(user.id, feature, enabled, settings);
    res.json({ message: 'Preference updated successfully' });
  } catch (error) {
    console.error('Error setting preference:', error);
    res.status(500).json({ error: 'Failed to set preference' });
  }
});

// Session Summary Generation
router.post('/sessions/:sessionId/summary', async (req, res) => {
  try {
    const user = getUser(req);
    const { sessionId } = req.params;
    const sessionData = req.body;

    // Check if user has consent for session summaries
    const hasConsent = await AIService.checkConsent(user.id, 'SESSION_SUMMARY');
    if (!hasConsent) {
      return res.status(403).json({ error: 'Consent required for session summary generation' });
    }

    const summary = await AIService.generateSessionSummary(sessionId, sessionData);
    res.json(summary);
  } catch (error) {
    console.error('Error generating session summary:', error);
    res.status(500).json({ error: 'Failed to generate session summary' });
  }
});

router.get('/sessions/:sessionId/summary', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Get session summary from database
    const summary = await prisma.sessionSummary.findUnique({
      where: { sessionId },
    });

    if (!summary) {
      return res.status(404).json({ error: 'Session summary not found' });
    }

    res.json(summary);
  } catch (error) {
    console.error('Error fetching session summary:', error);
    res.status(500).json({ error: 'Failed to fetch session summary' });
  }
});

// AI Assistant for Chat
router.post('/assistant', async (req, res) => {
  try {
    const user = getUser(req);
    const { message, context } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Check if user has consent for AI assistant
    const hasConsent = await AIService.checkConsent(user.id, 'AI_ASSISTANT');
    if (!hasConsent) {
      return res.status(403).json({ error: 'Consent required for AI assistant' });
    }

    const response = await AIService.generateAIResponse(user.id, message, context);
    res.json({ response });
  } catch (error) {
    console.error('Error generating AI response:', error);
    res.status(500).json({ error: 'Failed to generate AI response' });
  }
});

// AI-Generated Content Management
router.get('/content', async (req, res) => {
  try {
    const user = getUser(req);
    const { sessionId } = req.query;

    const content = await AIService.getGeneratedContent(user.id, sessionId as string);
    res.json(content);
  } catch (error) {
    console.error('Error fetching AI content:', error);
    res.status(500).json({ error: 'Failed to fetch AI content' });
  }
});

router.post('/content/:contentId/feedback', async (req, res) => {
  try {
    const { contentId } = req.params;
    const { feedback } = req.body;

    await AIService.updateContentFeedback(contentId, feedback);
    res.json({ message: 'Feedback updated successfully' });
  } catch (error) {
    console.error('Error updating content feedback:', error);
    res.status(500).json({ error: 'Failed to update feedback' });
  }
});

// Privacy and Compliance
router.get('/privacy-report', async (req, res) => {
  try {
    const user = getUser(req);
    const report = await AIService.getPrivacyReport(user.id);
    res.json(report);
  } catch (error) {
    console.error('Error generating privacy report:', error);
    res.status(500).json({ error: 'Failed to generate privacy report' });
  }
});

router.delete('/user-data', async (req, res) => {
  try {
    const user = getUser(req);
    await AIService.deleteUserData(user.id);
    res.json({ message: 'User data deleted successfully' });
  } catch (error) {
    console.error('Error deleting user data:', error);
    res.status(500).json({ error: 'Failed to delete user data' });
  }
});

// Health check for AI services
router.get('/health', async (req, res) => {
  try {
    if (!openai) {
      res.json({ 
        status: 'healthy',
        aiService: 'demo-mode',
        message: 'Running in demo mode without OpenAI API key',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Check if OpenAI API is accessible
    const testResponse = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Hello' }],
      max_tokens: 5,
    });

    res.json({ 
      status: 'healthy',
      aiService: 'operational',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('AI health check failed:', error);
    res.status(503).json({ 
      status: 'unhealthy',
      aiService: 'unavailable',
      error: error.message
    });
  }
});

export default router; 