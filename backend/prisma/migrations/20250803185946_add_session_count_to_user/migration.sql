/*
  Warnings:

  - You are about to drop the column `isPaused` on the `sessions` table. All the data in the column will be lost.
  - You are about to drop the column `pausedAt` on the `sessions` table. All the data in the column will be lost.
  - You are about to drop the column `resumedAt` on the `sessions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "sessions" DROP COLUMN "isPaused",
DROP COLUMN "pausedAt",
DROP COLUMN "resumedAt";
