-- CreateTable
CREATE TABLE "package_sector" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "sectorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "package_sector_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "package_sector_packageId_idx" ON "package_sector"("packageId");

-- CreateIndex
CREATE INDEX "package_sector_sectorId_idx" ON "package_sector"("sectorId");

-- CreateIndex
CREATE UNIQUE INDEX "package_sector_packageId_sectorId_key" ON "package_sector"("packageId", "sectorId");

-- AddForeignKey
ALTER TABLE "package_sector" ADD CONSTRAINT "package_sector_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "package"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_sector" ADD CONSTRAINT "package_sector_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "sector"("id") ON DELETE CASCADE ON UPDATE CASCADE;
