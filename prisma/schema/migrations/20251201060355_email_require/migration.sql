/*
  Warnings:

  - Made the column `email` on table `admins` required. This step will fail if there are existing NULL values in that column.
  - Made the column `email` on table `moderators` required. This step will fail if there are existing NULL values in that column.
  - Made the column `email` on table `traveler_profiles` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "admins" ALTER COLUMN "email" SET NOT NULL;

-- AlterTable
ALTER TABLE "moderators" ALTER COLUMN "email" SET NOT NULL;

-- AlterTable
ALTER TABLE "traveler_profiles" ALTER COLUMN "email" SET NOT NULL;
