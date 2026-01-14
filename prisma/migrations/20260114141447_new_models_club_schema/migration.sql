-- CreateEnum
CREATE TYPE "TableType" AS ENUM ('VIP', 'COMMON', 'LOUNGE', 'PREMIUM');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'OBSERVED', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "sector" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "capacity" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sector_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "table" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sectorId" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "tableType" TEXT NOT NULL DEFAULT 'COMMON',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "table_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "package" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "includedPeople" INTEGER NOT NULL,
    "basePrice" DECIMAL(10,2) NOT NULL,
    "extraPersonPrice" DECIMAL(10,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "package_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "image" TEXT,
    "visibilityStart" TIMESTAMP(3) NOT NULL,
    "visibilityEnd" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_sector" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "sectorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_sector_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_table" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "tableId" TEXT NOT NULL,
    "isBooked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_table_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guest" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "identityCard" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "loyaltyPoints" INTEGER NOT NULL DEFAULT 0,
    "eventsAttended" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "request" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "tableId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "hasConsumption" BOOLEAN NOT NULL DEFAULT false,
    "extraGuests" INTEGER NOT NULL DEFAULT 0,
    "termsAccepted" BOOLEAN NOT NULL DEFAULT false,
    "managerNotes" TEXT,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "reviewDuration" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guest_invitation" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guest_invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qr_entry" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" TIMESTAMP(3),
    "scannedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "qr_entry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sector_name_key" ON "sector"("name");

-- CreateIndex
CREATE INDEX "sector_isActive_idx" ON "sector"("isActive");

-- CreateIndex
CREATE INDEX "table_sectorId_idx" ON "table"("sectorId");

-- CreateIndex
CREATE INDEX "table_tableType_idx" ON "table"("tableType");

-- CreateIndex
CREATE INDEX "table_isActive_idx" ON "table"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "table_name_sectorId_key" ON "table"("name", "sectorId");

-- CreateIndex
CREATE INDEX "package_isActive_idx" ON "package"("isActive");

-- CreateIndex
CREATE INDEX "event_eventDate_idx" ON "event"("eventDate");

-- CreateIndex
CREATE INDEX "event_isActive_idx" ON "event"("isActive");

-- CreateIndex
CREATE INDEX "event_visibilityStart_visibilityEnd_idx" ON "event"("visibilityStart", "visibilityEnd");

-- CreateIndex
CREATE INDEX "event_sector_eventId_idx" ON "event_sector"("eventId");

-- CreateIndex
CREATE INDEX "event_sector_sectorId_idx" ON "event_sector"("sectorId");

-- CreateIndex
CREATE UNIQUE INDEX "event_sector_eventId_sectorId_key" ON "event_sector"("eventId", "sectorId");

-- CreateIndex
CREATE INDEX "event_table_eventId_idx" ON "event_table"("eventId");

-- CreateIndex
CREATE INDEX "event_table_tableId_idx" ON "event_table"("tableId");

-- CreateIndex
CREATE INDEX "event_table_isBooked_idx" ON "event_table"("isBooked");

-- CreateIndex
CREATE UNIQUE INDEX "event_table_eventId_tableId_key" ON "event_table"("eventId", "tableId");

-- CreateIndex
CREATE INDEX "guest_identityCard_idx" ON "guest"("identityCard");

-- CreateIndex
CREATE INDEX "guest_loyaltyPoints_idx" ON "guest"("loyaltyPoints");

-- CreateIndex
CREATE UNIQUE INDEX "guest_identityCard_key" ON "guest"("identityCard");

-- CreateIndex
CREATE INDEX "request_eventId_idx" ON "request"("eventId");

-- CreateIndex
CREATE INDEX "request_tableId_idx" ON "request"("tableId");

-- CreateIndex
CREATE INDEX "request_packageId_idx" ON "request"("packageId");

-- CreateIndex
CREATE INDEX "request_clientId_idx" ON "request"("clientId");

-- CreateIndex
CREATE INDEX "request_createdById_idx" ON "request"("createdById");

-- CreateIndex
CREATE INDEX "request_approvedById_idx" ON "request"("approvedById");

-- CreateIndex
CREATE INDEX "request_status_idx" ON "request"("status");

-- CreateIndex
CREATE INDEX "request_createdAt_idx" ON "request"("createdAt");

-- CreateIndex
CREATE INDEX "guest_invitation_requestId_idx" ON "guest_invitation"("requestId");

-- CreateIndex
CREATE INDEX "guest_invitation_guestId_idx" ON "guest_invitation"("guestId");

-- CreateIndex
CREATE UNIQUE INDEX "guest_invitation_requestId_guestId_key" ON "guest_invitation"("requestId", "guestId");

-- CreateIndex
CREATE UNIQUE INDEX "qr_entry_code_key" ON "qr_entry"("code");

-- CreateIndex
CREATE INDEX "qr_entry_code_idx" ON "qr_entry"("code");

-- CreateIndex
CREATE INDEX "qr_entry_guestId_idx" ON "qr_entry"("guestId");

-- CreateIndex
CREATE INDEX "qr_entry_requestId_idx" ON "qr_entry"("requestId");

-- CreateIndex
CREATE INDEX "qr_entry_isUsed_idx" ON "qr_entry"("isUsed");

-- AddForeignKey
ALTER TABLE "table" ADD CONSTRAINT "table_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "sector"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_sector" ADD CONSTRAINT "event_sector_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_sector" ADD CONSTRAINT "event_sector_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "sector"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_table" ADD CONSTRAINT "event_table_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_table" ADD CONSTRAINT "event_table_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "table"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request" ADD CONSTRAINT "request_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request" ADD CONSTRAINT "request_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "table"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request" ADD CONSTRAINT "request_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "package"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request" ADD CONSTRAINT "request_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "guest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request" ADD CONSTRAINT "request_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request" ADD CONSTRAINT "request_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_invitation" ADD CONSTRAINT "guest_invitation_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "request"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_invitation" ADD CONSTRAINT "guest_invitation_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "guest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qr_entry" ADD CONSTRAINT "qr_entry_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "guest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qr_entry" ADD CONSTRAINT "qr_entry_scannedById_fkey" FOREIGN KEY ("scannedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
