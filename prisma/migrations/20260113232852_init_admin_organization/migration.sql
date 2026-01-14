/*
  Warnings:

  - You are about to drop the column `ownerId` on the `organization` table. All the data in the column will be lost.
  - You are about to drop the column `bossId` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `user` table. All the data in the column will be lost.
  - You are about to drop the `activation_code` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `activation_redemption` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `club_table` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `event` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `event_sector` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `event_table_instance` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `guest` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `guest_list` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `organization_member` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `qr_scan` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `reservation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `subscription` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `team` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `team_member` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_dependency` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_profile` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[slug]` on the table `organization` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[username]` on the table `user` will be added. If there are existing duplicate values, this will fail.
  - Made the column `email` on table `user` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "activation_redemption" DROP CONSTRAINT "activation_redemption_activationCodeId_fkey";

-- DropForeignKey
ALTER TABLE "activation_redemption" DROP CONSTRAINT "activation_redemption_subscriptionId_fkey";

-- DropForeignKey
ALTER TABLE "activation_redemption" DROP CONSTRAINT "activation_redemption_userId_fkey";

-- DropForeignKey
ALTER TABLE "club_table" DROP CONSTRAINT "club_table_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "event" DROP CONSTRAINT "event_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "event_sector" DROP CONSTRAINT "event_sector_eventId_fkey";

-- DropForeignKey
ALTER TABLE "event_table_instance" DROP CONSTRAINT "event_table_instance_eventId_fkey";

-- DropForeignKey
ALTER TABLE "event_table_instance" DROP CONSTRAINT "event_table_instance_tableId_fkey";

-- DropForeignKey
ALTER TABLE "guest" DROP CONSTRAINT "guest_guestListId_fkey";

-- DropForeignKey
ALTER TABLE "guest" DROP CONSTRAINT "guest_reservationId_fkey";

-- DropForeignKey
ALTER TABLE "guest_list" DROP CONSTRAINT "guest_list_eventId_fkey";

-- DropForeignKey
ALTER TABLE "guest_list" DROP CONSTRAINT "guest_list_sectorId_fkey";

-- DropForeignKey
ALTER TABLE "organization" DROP CONSTRAINT "organization_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "organization_member" DROP CONSTRAINT "organization_member_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "organization_member" DROP CONSTRAINT "organization_member_userId_fkey";

-- DropForeignKey
ALTER TABLE "qr_scan" DROP CONSTRAINT "qr_scan_guestId_fkey";

-- DropForeignKey
ALTER TABLE "qr_scan" DROP CONSTRAINT "qr_scan_scannedBy_fkey";

-- DropForeignKey
ALTER TABLE "reservation" DROP CONSTRAINT "reservation_approverId_fkey";

-- DropForeignKey
ALTER TABLE "reservation" DROP CONSTRAINT "reservation_eventId_fkey";

-- DropForeignKey
ALTER TABLE "reservation" DROP CONSTRAINT "reservation_sellerId_fkey";

-- DropForeignKey
ALTER TABLE "reservation" DROP CONSTRAINT "reservation_tableInstanceId_fkey";

-- DropForeignKey
ALTER TABLE "subscription" DROP CONSTRAINT "subscription_userId_fkey";

-- DropForeignKey
ALTER TABLE "team" DROP CONSTRAINT "team_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "team_member" DROP CONSTRAINT "team_member_teamId_fkey";

-- DropForeignKey
ALTER TABLE "team_member" DROP CONSTRAINT "team_member_userId_fkey";

-- DropForeignKey
ALTER TABLE "user" DROP CONSTRAINT "user_bossId_fkey";

-- DropForeignKey
ALTER TABLE "user_dependency" DROP CONSTRAINT "user_dependency_dependentId_fkey";

-- DropForeignKey
ALTER TABLE "user_dependency" DROP CONSTRAINT "user_dependency_dependsOnId_fkey";

-- DropForeignKey
ALTER TABLE "user_profile" DROP CONSTRAINT "user_profile_userId_fkey";

-- AlterTable
ALTER TABLE "organization" DROP COLUMN "ownerId",
ADD COLUMN     "logo" TEXT,
ADD COLUMN     "metadata" TEXT,
ADD COLUMN     "slug" TEXT;

-- AlterTable
ALTER TABLE "session" ADD COLUMN     "impersonatedBy" TEXT;

-- AlterTable
ALTER TABLE "user" DROP COLUMN "bossId",
DROP COLUMN "password",
ADD COLUMN     "banExpires" TIMESTAMP(3),
ADD COLUMN     "banReason" TEXT,
ADD COLUMN     "banned" BOOLEAN DEFAULT false,
ADD COLUMN     "displayUsername" TEXT,
ADD COLUMN     "role" TEXT,
ADD COLUMN     "username" TEXT,
ALTER COLUMN "email" SET NOT NULL;

-- DropTable
DROP TABLE "activation_code";

-- DropTable
DROP TABLE "activation_redemption";

-- DropTable
DROP TABLE "club_table";

-- DropTable
DROP TABLE "event";

-- DropTable
DROP TABLE "event_sector";

-- DropTable
DROP TABLE "event_table_instance";

-- DropTable
DROP TABLE "guest";

-- DropTable
DROP TABLE "guest_list";

-- DropTable
DROP TABLE "organization_member";

-- DropTable
DROP TABLE "qr_scan";

-- DropTable
DROP TABLE "reservation";

-- DropTable
DROP TABLE "subscription";

-- DropTable
DROP TABLE "team";

-- DropTable
DROP TABLE "team_member";

-- DropTable
DROP TABLE "user_dependency";

-- DropTable
DROP TABLE "user_profile";

-- DropEnum
DROP TYPE "ClubRole";

-- DropEnum
DROP TYPE "GlobalRole";

-- DropEnum
DROP TYPE "OrgRole";

-- DropEnum
DROP TYPE "PlanType";

-- DropEnum
DROP TYPE "ReservationStatus";

-- DropEnum
DROP TYPE "ScanResult";

-- DropEnum
DROP TYPE "SubscriptionStatus";

-- DropEnum
DROP TYPE "TableStatus";

-- DropEnum
DROP TYPE "TeamRole";

-- CreateTable
CREATE TABLE "member" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invitation" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "inviterId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "member_organizationId_userId_key" ON "member"("organizationId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "organization_slug_key" ON "organization"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "user_username_key" ON "user"("username");

-- AddForeignKey
ALTER TABLE "member" ADD CONSTRAINT "member_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member" ADD CONSTRAINT "member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
