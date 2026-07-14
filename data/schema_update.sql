-- Add inventory_quantity to products table
ALTER TABLE products ADD COLUMN inventory_quantity integer DEFAULT 10;

UPDATE products SET inventory_quantity = 50 WHERE in_stock = true;
