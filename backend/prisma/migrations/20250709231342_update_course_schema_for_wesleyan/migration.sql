/*
  Warnings:

  - You are about to drop the column `description` on the `courses` table. All the data in the column will be lost.
  - You are about to drop the column `level` on the `courses` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `courses` table. All the data in the column will be lost.

*/
-- AlterTable
-- First add the new columns with default values
ALTER TABLE "courses" ADD COLUMN "credits" DOUBLE PRECISION NOT NULL DEFAULT 1.0;
ALTER TABLE "courses" ADD COLUMN "number" TEXT NOT NULL DEFAULT '000';
ALTER TABLE "courses" ADD COLUMN "professor" TEXT;
ALTER TABLE "courses" ADD COLUMN "term" TEXT;
ALTER TABLE "courses" ADD COLUMN "title" TEXT NOT NULL DEFAULT 'Course';

-- Update existing records to use the old name as title and extract number from code
UPDATE "courses" SET 
  "title" = "name",
  "number" = CASE 
    WHEN "code" ~ '^[A-Z]+\d+$' THEN regexp_replace("code", '^[A-Z]+', '')
    ELSE '000'
  END;

-- Now drop the old columns
ALTER TABLE "courses" DROP COLUMN "description";
ALTER TABLE "courses" DROP COLUMN "level";
ALTER TABLE "courses" DROP COLUMN "name";
