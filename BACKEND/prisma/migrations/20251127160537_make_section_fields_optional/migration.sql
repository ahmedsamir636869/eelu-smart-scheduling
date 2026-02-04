/*
  Warnings:

  - The values [FRIDAY] on the enum `DayOfWeek` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `mode` on the `Section` table. All the data in the column will be lost.
  - You are about to drop the column `studentGroupId` on the `Section` table. All the data in the column will be lost.
  - You are about to drop the `StudentGroup` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "DayOfWeek_new" AS ENUM ('SATURDAY', 'SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY');
ALTER TABLE "Section" ALTER COLUMN "day" TYPE "DayOfWeek_new" USING ("day"::text::"DayOfWeek_new");
ALTER TYPE "DayOfWeek" RENAME TO "DayOfWeek_old";
ALTER TYPE "DayOfWeek_new" RENAME TO "DayOfWeek";
DROP TYPE "public"."DayOfWeek_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "public"."Section" DROP CONSTRAINT "Section_classroomId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Section" DROP CONSTRAINT "Section_instructorId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Section" DROP CONSTRAINT "Section_scheduleId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Section" DROP CONSTRAINT "Section_studentGroupId_fkey";

-- DropForeignKey
ALTER TABLE "public"."StudentGroup" DROP CONSTRAINT "StudentGroup_departmentId_fkey";

-- AlterTable
ALTER TABLE "Section" DROP COLUMN "mode",
DROP COLUMN "studentGroupId",
ALTER COLUMN "scheduleId" DROP NOT NULL,
ALTER COLUMN "classroomId" DROP NOT NULL,
ALTER COLUMN "day" DROP NOT NULL,
ALTER COLUMN "endTime" DROP NOT NULL,
ALTER COLUMN "instructorId" DROP NOT NULL,
ALTER COLUMN "startTime" DROP NOT NULL,
ALTER COLUMN "studentCount" SET DEFAULT 0;

-- DropTable
DROP TABLE "public"."StudentGroup";

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;
