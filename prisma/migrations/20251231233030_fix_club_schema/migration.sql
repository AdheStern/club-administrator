/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `club_table` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "club_table" DROP CONSTRAINT "club_table_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "event" DROP CONSTRAINT "event_organizationId_fkey";

-- DropIndex
DROP INDEX "club_table_organizationId_name_key";

-- AlterTable
ALTER TABLE "club_table" ALTER COLUMN "organizationId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "event" ALTER COLUMN "organizationId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "club_table_name_key" ON "club_table"("name");

-- AddForeignKey
ALTER TABLE "club_table" ADD CONSTRAINT "club_table_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event" ADD CONSTRAINT "event_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
