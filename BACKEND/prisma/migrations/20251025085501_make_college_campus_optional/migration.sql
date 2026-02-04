-- DropForeignKey
ALTER TABLE "public"."College" DROP CONSTRAINT "College_campusId_fkey";

-- AlterTable
ALTER TABLE "College" ALTER COLUMN "campusId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "College" ADD CONSTRAINT "College_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE SET NULL ON UPDATE CASCADE;
