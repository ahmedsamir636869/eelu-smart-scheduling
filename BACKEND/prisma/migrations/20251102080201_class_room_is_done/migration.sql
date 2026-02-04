/*
  Warnings:

  - The values [SEMINAR_ROOM,STUDIO] on the enum `ClassroomType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `departmentId` on the `Classroom` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name,campusId]` on the table `Classroom` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `campusId` to the `Classroom` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ClassroomType_new" AS ENUM ('LECTURE_HALL', 'LAB');
ALTER TABLE "Classroom" ALTER COLUMN "type" TYPE "ClassroomType_new" USING ("type"::text::"ClassroomType_new");
ALTER TYPE "ClassroomType" RENAME TO "ClassroomType_old";
ALTER TYPE "ClassroomType_new" RENAME TO "ClassroomType";
DROP TYPE "public"."ClassroomType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "public"."Classroom" DROP CONSTRAINT "Classroom_departmentId_fkey";

-- AlterTable
ALTER TABLE "Classroom" DROP COLUMN "departmentId",
ADD COLUMN     "campusId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Classroom_name_campusId_key" ON "Classroom"("name", "campusId");

-- AddForeignKey
ALTER TABLE "Classroom" ADD CONSTRAINT "Classroom_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
