-- Add Fabric Hero Settings to Settings Table
ALTER TABLE settings 
ADD COLUMN IF NOT EXISTS fabric_hero_title TEXT DEFAULT 'Our Ankara Fabrics',
ADD COLUMN IF NOT EXISTS fabric_hero_subtitle TEXT DEFAULT 'Artisan Fabric Showcase';
