-- Add made-to-measure flag to order items
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS made_to_measure BOOLEAN DEFAULT FALSE;
