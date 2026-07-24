-- Migration script to add product_type column to products table if not exists
ALTER TABLE products ADD COLUMN IF NOT EXISTS product_type TEXT;
