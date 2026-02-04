/*
  Warnings:

  - The values [STUDENT] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `emailVerificationToken` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Section` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "SessionType" AS ENUM ('LECTURE', 'SECTION');

-- AlterEnum
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('INSTRUCTOR', 'ADMIN', 'TA');
ALTER TABLE "public"."User" ALTER COLUMN "roles" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "roles" TYPE "UserRole_new"[] USING ("roles"::text::"UserRole_new"[]);
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "public"."UserRole_old";
ALTER TABLE "User" ALTER COLUMN "roles" SET DEFAULT ARRAY['INSTRUCTOR']::"UserRole"[];
COMMIT;

-- DropForeignKey
ALTER TABLE "public"."Section" DROP CONSTRAINT "Section_classroomId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Section" DROP CONSTRAINT "Section_courseId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Section" DROP CONSTRAINT "Section_instructorId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Section" DROP CONSTRAINT "Section_scheduleId_fkey";

-- DropIndex
DROP INDEX "public"."User_emailVerificationToken_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "emailVerificationToken",
ADD COLUMN     "emailVerificationOtp" TEXT,
ADD COLUMN     "emailVerificationOtpExpires" TIMESTAMP(3);

-- DropTable
DROP TABLE "public"."Section";

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "SessionType" NOT NULL DEFAULT 'LECTURE',
    "day" "DayOfWeek",
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "studentCount" INTEGER NOT NULL DEFAULT 0,
    "courseId" TEXT NOT NULL,
    "instructorId" TEXT,
    "classroomId" TEXT,
    "scheduleId" TEXT,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;
