/*
  Warnings:

  - Made the column `email` on table `Instructor` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Instructor" ALTER COLUMN "email" SET NOT NULL;
