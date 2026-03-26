-- AlterTable
ALTER TABLE "event" ADD COLUMN     "hasCover" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "cover" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "cashAmount" DECIMAL(10,2) NOT NULL,
    "qrAmount" DECIMAL(10,2) NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cover_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cover_eventId_idx" ON "cover"("eventId");

-- CreateIndex
CREATE INDEX "cover_createdById_idx" ON "cover"("createdById");

-- CreateIndex
CREATE INDEX "cover_createdAt_idx" ON "cover"("createdAt");

-- AddForeignKey
ALTER TABLE "cover" ADD CONSTRAINT "cover_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cover" ADD CONSTRAINT "cover_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
