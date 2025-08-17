-- AlterTable
ALTER TABLE "sessions" ADD COLUMN     "rookieInCall" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tutoInCall" BOOLEAN NOT NULL DEFAULT false;
