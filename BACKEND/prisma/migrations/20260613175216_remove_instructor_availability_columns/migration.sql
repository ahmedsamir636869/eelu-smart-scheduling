/*
  Warnings:

  - You are about to drop the column `day` on the `Instructor` table. All the data in the column will be lost.
  - You are about to drop the column `endTime` on the `Instructor` table. All the data in the column will be lost.
  - You are about to drop the column `startTime` on the `Instructor` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Instructor" DROP COLUMN "day",
DROP COLUMN "endTime",
DROP COLUMN "startTime";
