/*
  Warnings:

  - You are about to drop the column `level` on the `forum_comments` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "forum_comments_level_idx";

-- DropIndex
DROP INDEX "forum_comments_parentCommentId_isDeleted_idx";

-- DropIndex
DROP INDEX "forum_comments_postId_isDeleted_createdAt_idx";

-- AlterTable
ALTER TABLE "forum_comments" DROP COLUMN "level";

-- AlterTable
ALTER TABLE "sessions" ADD COLUMN     "isPaused" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pausedAt" TIMESTAMP(3),
ADD COLUMN     "resumedAt" TIMESTAMP(3);
