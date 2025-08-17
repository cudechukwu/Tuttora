-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "SessionStatus" ADD VALUE 'PENDING_CONFIRMATION';
ALTER TYPE "SessionStatus" ADD VALUE 'EXPIRED_PENDING_REASSIGNMENT';

-- AlterTable
ALTER TABLE "sessions" ADD COLUMN     "canceledTutos" TEXT[],
ADD COLUMN     "rookieCanceledAt" TIMESTAMP(3),
ADD COLUMN     "rookieJoinedAt" TIMESTAMP(3);
