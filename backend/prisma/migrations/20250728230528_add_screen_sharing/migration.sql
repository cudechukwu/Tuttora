-- CreateTable
CREATE TABLE "screen_shares" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "sharerId" TEXT NOT NULL,
    "sharerName" TEXT NOT NULL,
    "sharerRole" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "screen_shares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "screen_share_viewers" (
    "id" TEXT NOT NULL,
    "screenShareId" TEXT NOT NULL,
    "viewerId" TEXT NOT NULL,
    "viewerName" TEXT NOT NULL,
    "viewerRole" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "screen_share_viewers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "screen_share_viewers_screenShareId_viewerId_key" ON "screen_share_viewers"("screenShareId", "viewerId");

-- AddForeignKey
ALTER TABLE "screen_shares" ADD CONSTRAINT "screen_shares_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "screen_shares" ADD CONSTRAINT "screen_shares_sharerId_fkey" FOREIGN KEY ("sharerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "screen_share_viewers" ADD CONSTRAINT "screen_share_viewers_screenShareId_fkey" FOREIGN KEY ("screenShareId") REFERENCES "screen_shares"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "screen_share_viewers" ADD CONSTRAINT "screen_share_viewers_viewerId_fkey" FOREIGN KEY ("viewerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
