-- AlterTable
ALTER TABLE "forum_comments" ADD COLUMN     "level" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "forum_comments_postId_isDeleted_createdAt_idx" ON "forum_comments"("postId", "isDeleted", "createdAt");

-- CreateIndex
CREATE INDEX "forum_comments_parentCommentId_isDeleted_idx" ON "forum_comments"("parentCommentId", "isDeleted");

-- CreateIndex
CREATE INDEX "forum_comments_level_idx" ON "forum_comments"("level");
