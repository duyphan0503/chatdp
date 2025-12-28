-- Update existing rows
UPDATE "Message" SET "search_vector" = to_tsvector('simple', coalesce("content", ''));

-- Create or Replace Function
CREATE OR REPLACE FUNCTION messages_search_vector_update() RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := to_tsvector('simple', coalesce(NEW.content, ''));
    RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- Create Trigger
DROP TRIGGER IF EXISTS messages_search_vector_update ON "Message";
CREATE TRIGGER messages_search_vector_update
BEFORE INSERT OR UPDATE ON "Message"
FOR EACH ROW EXECUTE PROCEDURE messages_search_vector_update();