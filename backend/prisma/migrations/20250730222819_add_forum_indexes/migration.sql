-- CreateIndex
CREATE INDEX "forum_posts_universityId_isDeleted_createdAt_idx" ON "forum_posts"("universityId", "isDeleted", "createdAt");

-- CreateIndex
CREATE INDEX "forum_posts_authorId_isDeleted_idx" ON "forum_posts"("authorId", "isDeleted");

-- CreateIndex
CREATE INDEX "forum_posts_tags_idx" ON "forum_posts"("tags");

-- CreateIndex
CREATE INDEX "forum_posts_postType_isDeleted_idx" ON "forum_posts"("postType", "isDeleted");

-- CreateIndex
CREATE INDEX "forum_posts_urgency_isDeleted_idx" ON "forum_posts"("urgency", "isDeleted");

-- CreateIndex
CREATE INDEX "forum_votes_postId_voteType_idx" ON "forum_votes"("postId", "voteType");

-- CreateIndex
CREATE INDEX "forum_votes_commentId_voteType_idx" ON "forum_votes"("commentId", "voteType");

-- CreateIndex
CREATE INDEX "forum_votes_userId_idx" ON "forum_votes"("userId");
