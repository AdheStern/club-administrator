/*
  Warnings:

  - The values [SELLER] on the enum `ClubRole` will be removed. If these variants are still used in the database, this will fail.
  - The values [APPROVED] on the enum `ReservationStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "ScanResult" AS ENUM ('SUCCESS', 'ALREADY_SCANNED', 'INVALID_EVENT', 'WRONG_SECTOR');

-- AlterEnum
BEGIN;
CREATE TYPE "ClubRole_new" AS ENUM ('ADMIN', 'APPROVER', 'HEAD_PROMOTER', 'PROMOTER', 'SECURITY');
ALTER TABLE "public"."organization_member" ALTER COLUMN "clubRole" DROP DEFAULT;
ALTER TABLE "organization_member" ALTER COLUMN "clubRole" TYPE "ClubRole_new" USING ("clubRole"::text::"ClubRole_new");
ALTER TYPE "ClubRole" RENAME TO "ClubRole_old";
ALTER TYPE "ClubRole_new" RENAME TO "ClubRole";
DROP TYPE "public"."ClubRole_old";
ALTER TABLE "organization_member" ALTER COLUMN "clubRole" SET DEFAULT 'PROMOTER';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "ReservationStatus_new" AS ENUM ('PENDING', 'APPROVED_WAITING_PAYMENT', 'CONFIRMED', 'OBSERVED', 'REJECTED', 'CANCELLED');
ALTER TABLE "public"."reservation" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "reservation" ALTER COLUMN "status" TYPE "ReservationStatus_new" USING ("status"::text::"ReservationStatus_new");
ALTER TYPE "ReservationStatus" RENAME TO "ReservationStatus_old";
ALTER TYPE "ReservationStatus_new" RENAME TO "ReservationStatus";
DROP TYPE "public"."ReservationStatus_old";
ALTER TABLE "reservation" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterTable
ALTER TABLE "event" ADD COLUMN     "flyerUrl" TEXT,
ADD COLUMN     "salesCloseDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "organization_member" ALTER COLUMN "clubRole" SET DEFAULT 'PROMOTER';

-- AlterTable
ALTER TABLE "reservation" ADD COLUMN     "acceptedRules" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "customerEmail" TEXT,
ADD COLUMN     "customerPhone" TEXT,
ADD COLUMN     "isGift" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "paymentProofUrl" TEXT,
ADD COLUMN     "sellerBossId" TEXT,
ADD COLUMN     "totalPax" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "bossId" TEXT;

-- CreateTable
CREATE TABLE "event_sector" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "requiresGuestList" BOOLEAN NOT NULL DEFAULT false,
    "tablesRequiredToUnlock" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "event_sector_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guest_list" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "sectorId" TEXT,
    "promoterId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guest_list_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guest" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT,
    "guestListId" TEXT,
    "name" TEXT NOT NULL,
    "docNumber" TEXT NOT NULL,
    "qrToken" TEXT NOT NULL,
    "isScanned" BOOLEAN NOT NULL DEFAULT false,
    "scannedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qr_scan" (
    "id" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "scannedBy" TEXT NOT NULL,
    "result" "ScanResult" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "qr_scan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "guest_qrToken_key" ON "guest"("qrToken");

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_bossId_fkey" FOREIGN KEY ("bossId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_sector" ADD CONSTRAINT "event_sector_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_list" ADD CONSTRAINT "guest_list_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_list" ADD CONSTRAINT "guest_list_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "event_sector"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest" ADD CONSTRAINT "guest_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest" ADD CONSTRAINT "guest_guestListId_fkey" FOREIGN KEY ("guestListId") REFERENCES "guest_list"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qr_scan" ADD CONSTRAINT "qr_scan_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "guest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qr_scan" ADD CONSTRAINT "qr_scan_scannedBy_fkey" FOREIGN KEY ("scannedBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
