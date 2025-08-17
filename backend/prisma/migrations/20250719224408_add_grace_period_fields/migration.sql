/*
  Warnings:

  - You are about to drop the column `isPaused` on the `sessions` table. All the data in the column will be lost.
  - You are about to drop the column `pauseStartTime` on the `sessions` table. All the data in the column will be lost.
  - You are about to drop the column `totalPausedTime` on the `sessions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "sessions" DROP COLUMN "isPaused",
DROP COLUMN "pauseStartTime",
DROP COLUMN "totalPausedTime",
ADD COLUMN     "acceptedAt" TIMESTAMP(3),
ADD COLUMN     "gracePeriodEnd" TIMESTAMP(3);
