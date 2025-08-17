/*
  Warnings:

  - A unique constraint covering the columns `[requestId]` on the table `sessions` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "sessions" DROP CONSTRAINT "sessions_tutoId_fkey";

-- AlterTable
ALTER TABLE "sessions" ADD COLUMN     "description" TEXT,
ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "isOnDemand" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isUrgent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "price" DOUBLE PRECISION,
ADD COLUMN     "requestId" TEXT,
ADD COLUMN     "subject" TEXT,
ADD COLUMN     "tags" TEXT[],
ADD COLUMN     "topic" TEXT,
ADD COLUMN     "urgencyNote" TEXT,
ALTER COLUMN "tutoId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "sessions_requestId_key" ON "sessions"("requestId");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_tutoId_fkey" FOREIGN KEY ("tutoId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
