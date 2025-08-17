-- CreateEnum
CREATE TYPE "SummarySource" AS ENUM ('ai', 'human', 'imported', 'scripted');

-- CreateEnum
CREATE TYPE "SummaryStatus" AS ENUM ('PENDING', 'COMPLETE', 'FAILED');

-- CreateEnum
CREATE TYPE "FeedbackRating" AS ENUM ('UP', 'DOWN');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "aiDisclaimerAcceptedAt" TIMESTAMP(3),
ADD COLUMN     "aiDisclaimerVersion" INTEGER;
