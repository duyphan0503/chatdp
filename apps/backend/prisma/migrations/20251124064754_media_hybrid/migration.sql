-- AlterTable
ALTER TABLE "Media" ADD COLUMN     "contentId" TEXT,
ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "lastAccessAt" TIMESTAMP(3),
ADD COLUMN     "objectKey" TEXT,
ADD COLUMN     "status" TEXT,
ADD COLUMN     "storageProvider" TEXT;

-- CreateIndex
CREATE INDEX "Media_expiresAt_idx" ON "Media"("expiresAt");

-- CreateIndex
CREATE INDEX "Media_lastAccessAt_idx" ON "Media"("lastAccessAt");
