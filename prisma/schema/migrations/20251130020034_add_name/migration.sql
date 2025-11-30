/*
  Warnings:

  - Added the required column `name` to the `admins` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `moderators` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `traveler_profiles` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "admins" ADD COLUMN     "name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "moderators" ADD COLUMN     "name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "traveler_profiles" ADD COLUMN     "name" TEXT NOT NULL;
