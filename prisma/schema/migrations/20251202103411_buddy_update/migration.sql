-- DropForeignKey
ALTER TABLE "buddy_requests" DROP CONSTRAINT "buddy_requests_tripId_fkey";

-- AlterTable
ALTER TABLE "buddy_requests" ALTER COLUMN "tripId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "buddy_requests" ADD CONSTRAINT "buddy_requests_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE SET NULL ON UPDATE CASCADE;
