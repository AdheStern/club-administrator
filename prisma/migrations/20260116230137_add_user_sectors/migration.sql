-- CreateTable
CREATE TABLE "user_sector" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sectorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_sector_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_sector_userId_idx" ON "user_sector"("userId");

-- CreateIndex
CREATE INDEX "user_sector_sectorId_idx" ON "user_sector"("sectorId");

-- CreateIndex
CREATE UNIQUE INDEX "user_sector_userId_sectorId_key" ON "user_sector"("userId", "sectorId");

-- AddForeignKey
ALTER TABLE "user_sector" ADD CONSTRAINT "user_sector_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_sector" ADD CONSTRAINT "user_sector_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "sector"("id") ON DELETE CASCADE ON UPDATE CASCADE;
