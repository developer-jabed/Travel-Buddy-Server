-- AlterTable
ALTER TABLE "trips" ADD COLUMN     "interests" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "safetyScore" INTEGER DEFAULT 50,
ADD COLUMN     "travelStyle" TEXT;
