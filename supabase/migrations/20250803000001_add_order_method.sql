-- Replace supports_custom_measurements with order_method enum

-- 1. Add the new order_method column (default whatsapp_only for current business state)
ALTER TABLE products ADD COLUMN IF NOT EXISTS order_method TEXT DEFAULT 'whatsapp_only'
  CHECK (order_method IN ('standard', 'standard_plus_custom', 'whatsapp_only'));

-- 2. Migrate data from the old boolean column if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'supports_custom_measurements'
  ) THEN
    UPDATE products SET order_method = 'standard_plus_custom' WHERE supports_custom_measurements = true;
    ALTER TABLE products DROP COLUMN supports_custom_measurements;
  END IF;
END $$;

-- 3. Add WhatsApp settings columns to settings table
ALTER TABLE settings ADD COLUMN IF NOT EXISTS whatsapp_enabled BOOLEAN DEFAULT true;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS whatsapp_label TEXT DEFAULT 'WhatsApp Enquiry';
