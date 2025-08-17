/*
  Warnings:

  - You are about to drop the column `description` on the `sessions` table. All the data in the column will be lost.
  - You are about to drop the column `expiresAt` on the `sessions` table. All the data in the column will be lost.
  - You are about to drop the column `isOnDemand` on the `sessions` table. All the data in the column will be lost.
  - You are about to drop the column `isUrgent` on the `sessions` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `sessions` table. All the data in the column will be lost.
  - You are about to drop the column `requestId` on the `sessions` table. All the data in the column will be lost.
  - You are about to drop the column `subject` on the `sessions` table. All the data in the column will be lost.
  - You are about to drop the column `tags` on the `sessions` table. All the data in the column will be lost.
  - You are about to drop the column `topic` on the `sessions` table. All the data in the column will be lost.
  - You are about to drop the column `urgencyNote` on the `sessions` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "sessions_requestId_key";

-- AlterTable
ALTER TABLE "sessions" DROP COLUMN "description",
DROP COLUMN "expiresAt",
DROP COLUMN "isOnDemand",
DROP COLUMN "isUrgent",
DROP COLUMN "price",
DROP COLUMN "requestId",
DROP COLUMN "subject",
DROP COLUMN "tags",
DROP COLUMN "topic",
DROP COLUMN "urgencyNote";

-- CreateTable
CREATE TABLE "rejected_requests" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "tutoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rejected_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "rejected_requests_sessionId_tutoId_key" ON "rejected_requests"("sessionId", "tutoId");

-- AddForeignKey
ALTER TABLE "rejected_requests" ADD CONSTRAINT "rejected_requests_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rejected_requests" ADD CONSTRAINT "rejected_requests_tutoId_fkey" FOREIGN KEY ("tutoId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
