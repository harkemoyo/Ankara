-- Run this in your Supabase SQL Editor to add contact page fields to settings
ALTER TABLE settings
ADD COLUMN IF NOT EXISTS contact_email TEXT DEFAULT 'support@maryhumphrey.com',
ADD COLUMN IF NOT EXISTS contact_hero_title TEXT DEFAULT 'Get In Touch',
ADD COLUMN IF NOT EXISTS contact_hero_subtitle TEXT DEFAULT "We'd love to hear from you. Whether you have a question about our products, an order, or just want to say hello — we're here.",
ADD COLUMN IF NOT EXISTS contact_response_time TEXT DEFAULT 'We aim to respond to all enquiries within 24–48 hours, Monday to Friday.',
ADD COLUMN IF NOT EXISTS contact_follow_us TEXT DEFAULT 'Stay connected on Instagram and TikTok for the latest collections, behind-the-scenes and styling inspiration.';

-- Enable realtime for settings if not already enabled
BEGIN;
  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
    ) THEN
      CREATE PUBLICATION supabase_realtime FOR TABLE settings;
    ELSE
      IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND tablename = 'settings'
      ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE settings;
      END IF;
    END IF;
  END $$;
COMMIT;
