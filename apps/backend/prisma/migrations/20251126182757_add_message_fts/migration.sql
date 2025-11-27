-- Phase 10 - Add full-text search support for messages

-- Generated column storing tsvector for message content
ALTER TABLE "Message"
ADD COLUMN "search_vector" tsvector
GENERATED ALWAYS AS (
  to_tsvector('simple', coalesce("content", ''))
) STORED;

-- GIN index for efficient full-text search on messages
CREATE INDEX "message_search_vector_idx"
ON "Message"
USING GIN ("search_vector");
