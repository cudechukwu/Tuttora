-- CreateEnum
CREATE TYPE "Semester" AS ENUM ('FALL', 'SPRING', 'SUMMER', 'WINTER');

-- AlterTable
ALTER TABLE "user_courses" ADD COLUMN     "semesterTaken" "Semester",
ADD COLUMN     "yearCompleted" INTEGER;
