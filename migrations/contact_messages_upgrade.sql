-- Run this in your Supabase SQL Editor to add the admin-only columns
ALTER TABLE contact_messages
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'new',
ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;

-- Enable realtime for contact_messages if not already enabled
BEGIN;
  -- Make sure the publication exists and the table is in it
  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
    ) THEN
      CREATE PUBLICATION supabase_realtime FOR TABLE contact_messages;
    ELSE
      IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND tablename = 'contact_messages'
      ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE contact_messages;
      END IF;
    END IF;
  END $$;
COMMIT;
