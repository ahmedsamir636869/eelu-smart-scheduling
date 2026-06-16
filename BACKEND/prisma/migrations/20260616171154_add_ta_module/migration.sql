-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('UNREAD', 'READ');

-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "taId" TEXT;

-- CreateTable
CREATE TABLE "TA" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "userId" TEXT,
    "departmentId" TEXT NOT NULL,
    "isExpatriate" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "TA_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TAOffDay" (
    "id" TEXT NOT NULL,
    "taId" TEXT NOT NULL,
    "day" "DayOfWeek" NOT NULL,

    CONSTRAINT "TAOffDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TAReport" (
    "id" TEXT NOT NULL,
    "taId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'UNREAD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TAReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TA_email_key" ON "TA"("email");

-- CreateIndex
CREATE UNIQUE INDEX "TA_userId_key" ON "TA"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TAOffDay_taId_day_key" ON "TAOffDay"("taId", "day");

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_taId_fkey" FOREIGN KEY ("taId") REFERENCES "TA"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TA" ADD CONSTRAINT "TA_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TA" ADD CONSTRAINT "TA_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TAOffDay" ADD CONSTRAINT "TAOffDay_taId_fkey" FOREIGN KEY ("taId") REFERENCES "TA"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TAReport" ADD CONSTRAINT "TAReport_taId_fkey" FOREIGN KEY ("taId") REFERENCES "TA"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
