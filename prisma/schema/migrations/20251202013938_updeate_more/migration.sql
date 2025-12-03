-- AlterTable
ALTER TABLE "users" ADD COLUMN     "interests" TEXT[],
ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false;
