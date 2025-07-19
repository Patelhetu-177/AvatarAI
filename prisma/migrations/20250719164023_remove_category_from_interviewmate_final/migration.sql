/*
  Warnings:

  - You are about to drop the column `categoryId` on the `InterviewMate` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "InterviewMate" DROP CONSTRAINT "InterviewMate_categoryId_fkey";

-- DropIndex
DROP INDEX "InterviewMate_categoryId_idx";

-- AlterTable
ALTER TABLE "InterviewMate" DROP COLUMN "categoryId";
