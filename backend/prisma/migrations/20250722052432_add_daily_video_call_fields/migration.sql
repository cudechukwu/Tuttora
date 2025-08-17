-- AlterTable
ALTER TABLE "sessions" ADD COLUMN     "callActive" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "callEndTime" TIMESTAMP(3),
ADD COLUMN     "callStartTime" TIMESTAMP(3),
ADD COLUMN     "dailyRoomName" TEXT,
ADD COLUMN     "dailyRoomUrl" TEXT;
