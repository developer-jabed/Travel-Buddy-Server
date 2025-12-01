/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `admins` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `moderators` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `traveler_profiles` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "admins" ADD COLUMN     "email" TEXT;

-- AlterTable
ALTER TABLE "moderators" ADD COLUMN     "email" TEXT;

-- AlterTable
ALTER TABLE "traveler_profiles" ADD COLUMN     "email" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "admins_email_key" ON "admins"("email");

-- CreateIndex
CREATE UNIQUE INDEX "moderators_email_key" ON "moderators"("email");

-- CreateIndex
CREATE UNIQUE INDEX "traveler_profiles_email_key" ON "traveler_profiles"("email");
