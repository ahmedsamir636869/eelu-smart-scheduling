/*
  Warnings:

  - You are about to drop the `Instructor` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('INSTRUCTOR', 'ADMIN', 'STUDENT');

-- DropForeignKey
ALTER TABLE "public"."Instructor" DROP CONSTRAINT "Instructor_departmentId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Section" DROP CONSTRAINT "Section_instructorId_fkey";

-- DropTable
DROP TABLE "public"."Instructor";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "roles" "UserRole"[] DEFAULT ARRAY['INSTRUCTOR']::"UserRole"[],
    "departmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
