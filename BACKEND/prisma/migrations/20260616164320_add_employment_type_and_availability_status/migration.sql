-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('FULL_TIME', 'PART_TIME');

-- CreateEnum
CREATE TYPE "AvailabilityStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "Instructor" ADD COLUMN     "employmentType" "EmploymentType" NOT NULL DEFAULT 'FULL_TIME';

-- AlterTable
ALTER TABLE "InstructorAvailability" ADD COLUMN     "status" "AvailabilityStatus" NOT NULL DEFAULT 'PENDING';
