-- CreateEnum
CREATE TYPE "ProficiencyLevel" AS ENUM ('CURRENTLY_TAKING', 'TOOK_COURSE', 'GOT_A', 'TUTORED_BEFORE', 'TAED');

-- AlterTable
ALTER TABLE "user_courses" ADD COLUMN     "proficiencyLevel" "ProficiencyLevel";
