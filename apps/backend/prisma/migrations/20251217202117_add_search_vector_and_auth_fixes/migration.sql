-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "search_vector" tsvector;

-- CreateIndex
CREATE INDEX "Message_search_vector_idx" ON "Message" USING GIN ("search_vector");
