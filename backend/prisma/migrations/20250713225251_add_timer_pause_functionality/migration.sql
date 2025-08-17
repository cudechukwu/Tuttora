-- AlterTable
ALTER TABLE "sessions" ADD COLUMN     "isPaused" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pauseStartTime" TIMESTAMP(3),
ADD COLUMN     "totalPausedTime" INTEGER NOT NULL DEFAULT 0;
