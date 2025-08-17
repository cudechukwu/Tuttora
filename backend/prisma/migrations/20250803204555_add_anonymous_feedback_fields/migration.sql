-- AlterTable
ALTER TABLE "sessions" ADD COLUMN     "rookieAnonymous" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tutoAnonymous" BOOLEAN NOT NULL DEFAULT false;
