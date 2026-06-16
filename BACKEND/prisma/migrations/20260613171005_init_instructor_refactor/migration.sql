/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `Instructor` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId]` on the table `Instructor` will be added. If there are existing duplicate values, this will fail.
  - Made the column `day` on table `Instructor` required. This step will fail if there are existing NULL values in that column.
  - Made the column `startTime` on table `Instructor` required. This step will fail if there are existing NULL values in that column.
  - Made the column `endTime` on table `Instructor` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Instructor" ADD COLUMN     "email" TEXT,
ADD COLUMN     "userId" TEXT,
ALTER COLUMN "day" SET NOT NULL,
ALTER COLUMN "startTime" SET NOT NULL,
ALTER COLUMN "endTime" SET NOT NULL;

-- CreateTable
CREATE TABLE "InstructorAvailability" (
    "id" TEXT NOT NULL,
    "instructorId" TEXT NOT NULL,
    "day" "DayOfWeek" NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstructorAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InstructorAvailability_instructorId_day_key" ON "InstructorAvailability"("instructorId", "day");

-- CreateIndex
CREATE UNIQUE INDEX "Instructor_email_key" ON "Instructor"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Instructor_userId_key" ON "Instructor"("userId");

-- AddForeignKey
ALTER TABLE "Instructor" ADD CONSTRAINT "Instructor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstructorAvailability" ADD CONSTRAINT "InstructorAvailability_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Instructor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
