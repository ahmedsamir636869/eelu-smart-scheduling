/*
  Warnings:

  - You are about to drop the column `hoursPerWeek` on the `Course` table. All the data in the column will be lost.
  - Added the required column `collegeId` to the `Course` table without a default value. This is not possible if the table is not empty.
  - Added the required column `days` to the `Course` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hoursPerDay` to the `Course` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Course" DROP COLUMN "hoursPerWeek",
ADD COLUMN     "collegeId" TEXT NOT NULL,
ADD COLUMN     "days" INTEGER NOT NULL,
ADD COLUMN     "hoursPerDay" INTEGER NOT NULL,
ADD COLUMN     "instructorId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "resetPasswordOtp" TEXT,
ADD COLUMN     "resetPasswordOtpExpires" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Instructor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "day" "DayOfWeek",
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),

    CONSTRAINT "Instructor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "studentCount" INTEGER NOT NULL,

    CONSTRAINT "StudentGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_AdditionalInstructors" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_AdditionalInstructors_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_AdditionalInstructors_B_index" ON "_AdditionalInstructors"("B");

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Instructor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Instructor" ADD CONSTRAINT "Instructor_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentGroup" ADD CONSTRAINT "StudentGroup_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AdditionalInstructors" ADD CONSTRAINT "_AdditionalInstructors_A_fkey" FOREIGN KEY ("A") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AdditionalInstructors" ADD CONSTRAINT "_AdditionalInstructors_B_fkey" FOREIGN KEY ("B") REFERENCES "Instructor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
