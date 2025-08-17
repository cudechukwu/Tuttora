import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';

// Type definitions for AI features
type AIFeature = 'SESSION_SUMMARY' | 'TRANSCRIPTION' | 'SMART_NOTES' | 'AI_ASSISTANT' | 'SENTIMENT_ANALYSIS' | 'CONTENT_RECOMMENDATIONS' | 'PRACTICE_GENERATION' | 'MATCHING';
type AIContentType = 'SESSION_SUMMARY' | 'ACTION_ITEMS' | 'SMART_NOTES' | 'TRANSCRIPT' | 'AI_RESPONSE' | 'RECOMMENDATION' | 'PRACTICE_QUESTION' | 'SENTIMENT_FEEDBACK';

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

export interface AIConsentData {
  userId: string;
  feature: AIFeature;
  consented: boolean;
}

export interface AIPreferenceData {
  userId: string;
  feature: AIFeature;
  enabled: boolean;
  settings?: Record<string, any>;
}

export interface AIGeneratedContentData {
  sessionId?: string;
  userId: string;
  contentType: AIContentType;
  content: string;
  metadata?: Record<string, any>;
}

export interface AnonymizedData {
  originalData: any;
  anonymizedData: any;
  anonymizationMap: Record<string, string>;
}

export class AIService {
  // Consent Management
  static async checkConsent(userId: string, feature: AIFeature): Promise<boolean> {
    const consent = await prisma.aIConsent.findUnique({
      where: {
        userId_feature: {
          userId,
          feature,
        },
      },
    });
    return consent?.consented || false;
  }

  static async setConsent(userId: string, feature: AIFeature, consented: boolean): Promise<void> {
    await prisma.aIConsent.upsert({
      where: {
        userId_feature: {
          userId,
          feature,
        },
      },
      update: {
        consented,
        consentedAt: consented ? new Date() : null,
        revokedAt: consented ? null : new Date(),
        updatedAt: new Date(),
      },
      create: {
        userId,
        feature,
        consented,
        consentedAt: consented ? new Date() : null,
        revokedAt: consented ? null : new Date(),
      },
    });
  }

  static async getConsents(userId: string): Promise<AIConsentData[]> {
    const consents = await prisma.aIConsent.findMany({
      where: { userId },
    });
    return consents.map(consent => ({
      userId: consent.userId,
      feature: consent.feature,
      consented: consent.consented,
    }));
  }

  // Preference Management
  static async setPreference(userId: string, feature: AIFeature, enabled: boolean, settings?: Record<string, any>): Promise<void> {
    await prisma.aIPreference.upsert({
      where: {
        userId_feature: {
          userId,
          feature,
        },
      },
      update: {
        enabled,
        settings,
        updatedAt: new Date(),
      },
      create: {
        userId,
        feature,
        enabled,
        settings,
      },
    });
  }

  static async getPreferences(userId: string): Promise<AIPreferenceData[]> {
    const preferences = await prisma.aIPreference.findMany({
      where: { userId },
    });
    return preferences.map(pref => ({
      userId: pref.userId,
      feature: pref.feature,
      enabled: pref.enabled,
      settings: pref.settings as Record<string, any>,
    }));
  }

  // Data Anonymization
  static anonymizeData(data: any): AnonymizedData {
    const anonymizationMap: Record<string, string> = {};
    const anonymizedData = JSON.parse(JSON.stringify(data));

    // Anonymize personal identifiers
    if (anonymizedData.firstName) {
      anonymizedData.firstName = `User_${Math.random().toString(36).substr(2, 9)}`;
      anonymizationMap[data.firstName] = anonymizedData.firstName;
    }

    if (anonymizedData.lastName) {
      anonymizedData.lastName = `User_${Math.random().toString(36).substr(2, 9)}`;
      anonymizationMap[data.lastName] = anonymizedData.lastName;
    }

    if (anonymizedData.email) {
      anonymizedData.email = `user_${Math.random().toString(36).substr(2, 9)}@example.com`;
      anonymizationMap[data.email] = anonymizedData.email;
    }

    if (anonymizedData.username) {
      anonymizedData.username = `user_${Math.random().toString(36).substr(2, 9)}`;
      anonymizationMap[data.username] = anonymizedData.username;
    }

    return {
      originalData: data,
      anonymizedData,
      anonymizationMap,
    };
  }

  // AI-Generated Content Storage
  static async storeGeneratedContent(data: AIGeneratedContentData): Promise<void> {
    await prisma.aIGeneratedContent.create({
      data: {
        sessionId: data.sessionId,
        userId: data.userId,
        contentType: data.contentType,
        content: data.content,
        metadata: data.metadata,
      },
    });
  }

  static async getGeneratedContent(userId: string, sessionId?: string): Promise<any[]> {
    const where: any = { userId, isActive: true };
    if (sessionId) {
      where.sessionId = sessionId;
    }

    return await prisma.aIGeneratedContent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  static async updateContentFeedback(contentId: string, feedback: Record<string, any>): Promise<void> {
    await prisma.aIGeneratedContent.update({
      where: { id: contentId },
      data: { feedback },
    });
  }

  // Session Summary Generation
  static async generateSessionSummary(sessionId: string, sessionData: any): Promise<any> {
    // Check if user has consented to session summaries
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        rookie: true,
        tuto: true,
        messages: true,
      },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    // Check consent for both users
    const rookieConsent = await this.checkConsent(session.rookieId, 'SESSION_SUMMARY');
    const tutoConsent = session.tutoId ? await this.checkConsent(session.tutoId, 'SESSION_SUMMARY') : false;

    if (!rookieConsent || !tutoConsent) {
      throw new Error('User consent required for session summary generation');
    }

    // Check if OpenAI is available
    if (!openai) {
      // Demo mode - return mock summary
      const mockSummary = {
        summary: "This was a productive tutoring session focused on key concepts. The student showed good understanding of the material.",
        keyConcepts: ["Concept A", "Concept B", "Concept C"],
        actionItems: ["Complete practice problems", "Review notes", "Prepare for next session"],
        nextSteps: ["Continue with advanced topics", "Schedule follow-up session"]
      };

      // Store the mock summary
      const summary = await prisma.sessionSummary.create({
        data: {
          sessionId,
          summary: mockSummary.summary,
          actionItems: mockSummary.actionItems,
          keyConcepts: mockSummary.keyConcepts,
          aiGenerated: true,
        },
      });

      // Store as generated content
      await this.storeGeneratedContent({
        sessionId,
        userId: session.rookieId,
        contentType: 'SESSION_SUMMARY',
        content: JSON.stringify(mockSummary),
        metadata: {
          model: 'demo-mode',
          temperature: 0.7,
          anonymized: true,
        },
      });

      return summary;
    }

    // Anonymize data before sending to AI
    const anonymizedData = this.anonymizeData(sessionData);

    // Generate summary using OpenAI
    const prompt = `Generate a concise summary of this tutoring session and extract action items. Focus on key concepts discussed and next steps.

Session Data: ${JSON.stringify(anonymizedData.anonymizedData)}

Please provide:
1. A brief summary (2-3 sentences)
2. Key concepts discussed (bullet points)
3. Action items/homework (bullet points)
4. Next steps for the student

Format as JSON with keys: summary, keyConcepts, actionItems, nextSteps`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    });

    const aiResponse = completion.choices[0]?.message?.content;
    if (!aiResponse) {
      throw new Error('Failed to generate AI response');
    }

    // Parse AI response
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiResponse);
    } catch (error) {
      // Fallback if JSON parsing fails
      parsedResponse = {
        summary: aiResponse,
        keyConcepts: [],
        actionItems: [],
        nextSteps: [],
      };
    }

    // Store the summary
    const summary = await prisma.sessionSummary.create({
      data: {
        sessionId,
        summary: parsedResponse.summary,
        actionItems: parsedResponse.actionItems,
        keyConcepts: parsedResponse.keyConcepts,
        aiGenerated: true,
      },
    });

    // Store as generated content
    await this.storeGeneratedContent({
      sessionId,
      userId: session.rookieId,
      contentType: 'SESSION_SUMMARY',
      content: JSON.stringify(parsedResponse),
      metadata: {
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
        anonymized: true,
      },
    });

    return summary;
  }

  // AI Assistant for Chat
  static async generateAIResponse(userId: string, message: string, context?: any): Promise<string> {
    // Check consent
    const hasConsent = await this.checkConsent(userId, 'AI_ASSISTANT');
    if (!hasConsent) {
      throw new Error('User consent required for AI assistant');
    }

    // Check if OpenAI is available
    if (!openai) {
      // Demo mode - return mock response
      const mockResponse = "I'm here to help with your tutoring questions! This is a demo response. In production, I would provide detailed educational assistance based on your specific question.";
      
      // Store the mock response
      await this.storeGeneratedContent({
        userId,
        contentType: 'AI_RESPONSE',
        content: mockResponse,
        metadata: {
          originalMessage: message,
          model: 'demo-mode',
          temperature: 0.7,
          anonymized: false,
        },
      });

      return mockResponse;
    }

    // Anonymize context if provided
    const anonymizedContext = context ? this.anonymizeData(context).anonymizedData : null;

    const prompt = `You are an AI tutor assistant. Help the user with their question or request.

User Question: ${message}
${anonymizedContext ? `Context: ${JSON.stringify(anonymizedContext)}` : ''}

Provide a helpful, educational response. Be concise but thorough.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 500,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('Failed to generate AI response');
    }

    // Store the response
    await this.storeGeneratedContent({
      userId,
      contentType: 'AI_RESPONSE',
      content: response,
      metadata: {
        originalMessage: message,
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
        anonymized: !!anonymizedContext,
      },
    });

    return response;
  }

  // Privacy and Compliance
  static async deleteUserData(userId: string): Promise<void> {
    // Soft delete AI-generated content
    await prisma.aIGeneratedContent.updateMany({
      where: { userId },
      data: { isActive: false },
    });

    // Delete consents and preferences
    await prisma.aIConsent.deleteMany({
      where: { userId },
    });

    await prisma.aIPreference.deleteMany({
      where: { userId },
    });
  }

  static async getPrivacyReport(userId: string): Promise<any> {
    const consents = await this.getConsents(userId);
    const preferences = await this.getPreferences(userId);
    const generatedContent = await this.getGeneratedContent(userId);

    return {
      consents,
      preferences,
      generatedContentCount: generatedContent.length,
      lastGeneratedContent: generatedContent[0]?.createdAt || null,
    };
  }
} 