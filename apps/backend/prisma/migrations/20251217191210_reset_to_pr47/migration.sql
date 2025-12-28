/*
  Warnings:

  - You are about to drop the column `search_vector` on the `Message` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Message_search_vector_idx";

-- AlterTable
ALTER TABLE "Message" DROP COLUMN "search_vector";
