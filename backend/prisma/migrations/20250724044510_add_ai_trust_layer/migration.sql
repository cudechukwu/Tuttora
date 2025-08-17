-- CreateEnum
CREATE TYPE "AIFeature" AS ENUM ('SESSION_SUMMARY', 'TRANSCRIPTION', 'SMART_NOTES', 'AI_ASSISTANT', 'SENTIMENT_ANALYSIS', 'CONTENT_RECOMMENDATIONS', 'PRACTICE_GENERATION', 'MATCHING');

-- CreateEnum
CREATE TYPE "AIContentType" AS ENUM ('SESSION_SUMMARY', 'ACTION_ITEMS', 'SMART_NOTES', 'TRANSCRIPT', 'AI_RESPONSE', 'RECOMMENDATION', 'PRACTICE_QUESTION', 'SENTIMENT_FEEDBACK');

-- CreateTable
CREATE TABLE "ai_consents" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "feature" "AIFeature" NOT NULL,
    "consented" BOOLEAN NOT NULL DEFAULT false,
    "consentedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_consents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "feature" "AIFeature" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_generated_content" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT,
    "userId" TEXT NOT NULL,
    "contentType" "AIContentType" NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "feedback" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_generated_content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_summaries" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "actionItems" JSONB NOT NULL,
    "keyConcepts" JSONB NOT NULL,
    "aiGenerated" BOOLEAN NOT NULL DEFAULT true,
    "feedback" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "session_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_transcripts" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "transcript" TEXT NOT NULL,
    "chunks" JSONB NOT NULL,
    "aiGenerated" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "session_transcripts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ai_consents_userId_feature_key" ON "ai_consents"("userId", "feature");

-- CreateIndex
CREATE UNIQUE INDEX "ai_preferences_userId_feature_key" ON "ai_preferences"("userId", "feature");

-- CreateIndex
CREATE UNIQUE INDEX "session_summaries_sessionId_key" ON "session_summaries"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "session_transcripts_sessionId_key" ON "session_transcripts"("sessionId");

-- AddForeignKey
ALTER TABLE "ai_consents" ADD CONSTRAINT "ai_consents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_preferences" ADD CONSTRAINT "ai_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_generated_content" ADD CONSTRAINT "ai_generated_content_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_generated_content" ADD CONSTRAINT "ai_generated_content_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_summaries" ADD CONSTRAINT "session_summaries_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_transcripts" ADD CONSTRAINT "session_transcripts_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
