-- CreateEnum
CREATE TYPE "SkillLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT');

-- CreateEnum
CREATE TYPE "SkillCategory" AS ENUM ('TECHNICAL', 'SOFT_SKILLS', 'LANGUAGES', 'TOOLS');

-- AlterTable
ALTER TABLE "rookie_profiles" ADD COLUMN     "academicAwards" TEXT[],
ADD COLUMN     "academicStanding" TEXT,
ADD COLUMN     "expectedGraduationDate" TIMESTAMP(3),
ADD COLUMN     "researchExperience" TEXT;

-- AlterTable
ALTER TABLE "tuto_profiles" ADD COLUMN     "academicAwards" TEXT[],
ADD COLUMN     "academicStanding" TEXT,
ADD COLUMN     "expectedGraduationDate" TIMESTAMP(3),
ADD COLUMN     "researchExperience" TEXT;

-- AlterTable
ALTER TABLE "user_courses" ADD COLUMN     "courseNotes" TEXT,
ADD COLUMN     "courseReview" TEXT,
ADD COLUMN     "difficultyRating" INTEGER,
ADD COLUMN     "grade" TEXT,
ADD COLUMN     "professor" TEXT,
ADD COLUMN     "timeSpent" INTEGER,
ADD COLUMN     "wouldRecommend" BOOLEAN;

-- CreateTable
CREATE TABLE "user_skills" (
    "id" TEXT NOT NULL,
    "skillName" TEXT NOT NULL,
    "proficiencyLevel" "SkillLevel" NOT NULL,
    "category" "SkillCategory" NOT NULL,
    "selfAssessment" INTEGER,
    "evidence" TEXT[],
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_skills_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_skills_userId_skillName_key" ON "user_skills"("userId", "skillName");

-- AddForeignKey
ALTER TABLE "user_skills" ADD CONSTRAINT "user_skills_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
