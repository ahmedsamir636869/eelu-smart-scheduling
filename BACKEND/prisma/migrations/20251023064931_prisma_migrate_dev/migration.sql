/*
  Warnings:

  - The primary key for the `Course` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `createdAt` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the column `instructorId` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Course` table. All the data in the column will be lost.
  - The primary key for the `Section` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `createdAt` on the `Section` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Section` table. All the data in the column will be lost.
  - You are about to drop the `Enrollment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ScheduleEvaluation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[code]` on the table `Course` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `Course` table without a default value. This is not possible if the table is not empty.
  - Added the required column `departmentId` to the `Course` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hoursPerWeek` to the `Course` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `Course` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Course` table without a default value. This is not possible if the table is not empty.
  - Added the required column `classroomId` to the `Section` table without a default value. This is not possible if the table is not empty.
  - Added the required column `day` to the `Section` table without a default value. This is not possible if the table is not empty.
  - Added the required column `endTime` to the `Section` table without a default value. This is not possible if the table is not empty.
  - Added the required column `instructorId` to the `Section` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mode` to the `Section` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startTime` to the `Section` table without a default value. This is not possible if the table is not empty.
  - Added the required column `studentCount` to the `Section` table without a default value. This is not possible if the table is not empty.
  - Added the required column `studentGroupId` to the `Section` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('SATURDAY', 'SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY');

-- CreateEnum
CREATE TYPE "CourseType" AS ENUM ('THEORETICAL', 'PRACTICAL');

-- CreateEnum
CREATE TYPE "ClassroomType" AS ENUM ('LECTURE_HALL', 'LAB', 'SEMINAR_ROOM', 'STUDIO');

-- DropForeignKey
ALTER TABLE "public"."Course" DROP CONSTRAINT "Course_instructorId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Enrollment" DROP CONSTRAINT "Enrollment_courseId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Enrollment" DROP CONSTRAINT "Enrollment_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ScheduleEvaluation" DROP CONSTRAINT "ScheduleEvaluation_scheduleId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Section" DROP CONSTRAINT "Section_courseId_fkey";

-- AlterTable
ALTER TABLE "Course" DROP CONSTRAINT "Course_pkey",
DROP COLUMN "createdAt",
DROP COLUMN "description",
DROP COLUMN "instructorId",
DROP COLUMN "title",
DROP COLUMN "updatedAt",
ADD COLUMN     "code" TEXT NOT NULL,
ADD COLUMN     "departmentId" TEXT NOT NULL,
ADD COLUMN     "hoursPerWeek" INTEGER NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "type" "CourseType" NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Course_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Course_id_seq";

-- AlterTable
ALTER TABLE "Section" DROP CONSTRAINT "Section_pkey",
DROP COLUMN "createdAt",
DROP COLUMN "name",
ADD COLUMN     "classroomId" TEXT NOT NULL,
ADD COLUMN     "day" "DayOfWeek" NOT NULL,
ADD COLUMN     "endTime" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "instructorId" TEXT NOT NULL,
ADD COLUMN     "mode" TEXT NOT NULL,
ADD COLUMN     "startTime" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "studentCount" INTEGER NOT NULL,
ADD COLUMN     "studentGroupId" TEXT NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "courseId" SET DATA TYPE TEXT,
ADD CONSTRAINT "Section_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Section_id_seq";

-- DropTable
DROP TABLE "public"."Enrollment";

-- DropTable
DROP TABLE "public"."ScheduleEvaluation";

-- DropTable
DROP TABLE "public"."User";

-- DropEnum
DROP TYPE "public"."Role";

-- CreateTable
CREATE TABLE "Campus" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,

    CONSTRAINT "Campus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "College" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "campusId" TEXT NOT NULL,

    CONSTRAINT "College_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "collegeId" TEXT NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Instructor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,

    CONSTRAINT "Instructor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "departmentId" TEXT NOT NULL,

    CONSTRAINT "StudentGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Classroom" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "type" "ClassroomType" NOT NULL,
    "departmentId" TEXT NOT NULL,

    CONSTRAINT "Classroom_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Course_code_key" ON "Course"("code");

-- AddForeignKey
ALTER TABLE "College" ADD CONSTRAINT "College_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Instructor" ADD CONSTRAINT "Instructor_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentGroup" ADD CONSTRAINT "StudentGroup_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Classroom" ADD CONSTRAINT "Classroom_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Instructor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_studentGroupId_fkey" FOREIGN KEY ("studentGroupId") REFERENCES "StudentGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
