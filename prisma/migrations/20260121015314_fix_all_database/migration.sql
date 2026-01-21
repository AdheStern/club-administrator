-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'OBSERVED', 'PRE_APPROVED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'SUPERVISOR', 'VALIDATOR', 'USER');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "OrgRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "TableType" AS ENUM ('VIP', 'COMMON', 'LOUNGE', 'PREMIUM');

-- CreateEnum
CREATE TYPE "QRUsageType" AS ENUM ('SINGLE_USE', 'MULTI_USE', 'UNLIMITED', 'DATE_RANGE');

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL,
    "image" TEXT,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "banned" BOOLEAN DEFAULT false,
    "banReason" TEXT,
    "banExpires" TIMESTAMP(3),
    "role" TEXT NOT NULL DEFAULT 'USER',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "departmentId" TEXT,
    "managerId" TEXT,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logo" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_member" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_invitation" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "inviterId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "department" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sector" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "capacity" INTEGER NOT NULL,
    "requiresGuestList" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sector_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_sector" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sectorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_sector_pkey" PRIMARY KEY ("id")
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
    "paymentQR" TEXT,
    "commissionAmount" DECIMAL(10,2),
    "freeInvitationQRCount" INTEGER NOT NULL DEFAULT 0,
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
    "instagramHandle" TEXT,
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
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "isPreApproved" BOOLEAN NOT NULL DEFAULT false,
    "extraGuests" INTEGER NOT NULL DEFAULT 0,
    "termsAccepted" BOOLEAN NOT NULL DEFAULT false,
    "managerNotes" TEXT,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "preApprovedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
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
    "usageType" TEXT NOT NULL DEFAULT 'SINGLE_USE',
    "maxUses" INTEGER,
    "currentUses" INTEGER NOT NULL DEFAULT 0,
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "scannedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "qr_entry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qr_scan" (
    "id" TEXT NOT NULL,
    "qrEntryId" TEXT NOT NULL,
    "scannedById" TEXT NOT NULL,
    "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "location" TEXT,
    "notes" TEXT,

    CONSTRAINT "qr_scan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_departmentId_idx" ON "user"("departmentId");

-- CreateIndex
CREATE INDEX "user_managerId_idx" ON "user"("managerId");

-- CreateIndex
CREATE INDEX "user_role_idx" ON "user"("role");

-- CreateIndex
CREATE INDEX "user_status_idx" ON "user"("status");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE UNIQUE INDEX "organization_slug_key" ON "organization"("slug");

-- CreateIndex
CREATE INDEX "organization_member_userId_idx" ON "organization_member"("userId");

-- CreateIndex
CREATE INDEX "organization_member_organizationId_idx" ON "organization_member"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "organization_member_organizationId_userId_key" ON "organization_member"("organizationId", "userId");

-- CreateIndex
CREATE INDEX "organization_invitation_email_idx" ON "organization_invitation"("email");

-- CreateIndex
CREATE INDEX "organization_invitation_status_idx" ON "organization_invitation"("status");

-- CreateIndex
CREATE UNIQUE INDEX "organization_invitation_organizationId_email_key" ON "organization_invitation"("organizationId", "email");

-- CreateIndex
CREATE INDEX "department_parentId_idx" ON "department"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "sector_name_key" ON "sector"("name");

-- CreateIndex
CREATE INDEX "sector_isActive_idx" ON "sector"("isActive");

-- CreateIndex
CREATE INDEX "user_sector_userId_idx" ON "user_sector"("userId");

-- CreateIndex
CREATE INDEX "user_sector_sectorId_idx" ON "user_sector"("sectorId");

-- CreateIndex
CREATE UNIQUE INDEX "user_sector_userId_sectorId_key" ON "user_sector"("userId", "sectorId");

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
CREATE INDEX "guest_instagramHandle_idx" ON "guest"("instagramHandle");

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
CREATE INDEX "request_isPaid_idx" ON "request"("isPaid");

-- CreateIndex
CREATE INDEX "request_isPreApproved_idx" ON "request"("isPreApproved");

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
CREATE INDEX "qr_entry_isActive_idx" ON "qr_entry"("isActive");

-- CreateIndex
CREATE INDEX "qr_entry_usageType_idx" ON "qr_entry"("usageType");

-- CreateIndex
CREATE INDEX "qr_scan_qrEntryId_idx" ON "qr_scan"("qrEntryId");

-- CreateIndex
CREATE INDEX "qr_scan_scannedById_idx" ON "qr_scan"("scannedById");

-- CreateIndex
CREATE INDEX "qr_scan_scannedAt_idx" ON "qr_scan"("scannedAt");

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_member" ADD CONSTRAINT "organization_member_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_member" ADD CONSTRAINT "organization_member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_invitation" ADD CONSTRAINT "organization_invitation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_invitation" ADD CONSTRAINT "organization_invitation_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department" ADD CONSTRAINT "department_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_sector" ADD CONSTRAINT "user_sector_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_sector" ADD CONSTRAINT "user_sector_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "sector"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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

-- AddForeignKey
ALTER TABLE "qr_scan" ADD CONSTRAINT "qr_scan_qrEntryId_fkey" FOREIGN KEY ("qrEntryId") REFERENCES "qr_entry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qr_scan" ADD CONSTRAINT "qr_scan_scannedById_fkey" FOREIGN KEY ("scannedById") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
