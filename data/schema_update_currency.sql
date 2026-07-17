-- Add exchange_rate to settings table (default 130.00)
ALTER TABLE settings ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC(10,2) DEFAULT 130.00;

-- Add announcements array to settings table to support rotating announcement bar
ALTER TABLE settings ADD COLUMN IF NOT EXISTS announcements TEXT[] DEFAULT ARRAY[
  '✨ FREE SHIPPING IN KENYA | Celebrating African Heritage Through Fashion',
  '🚚 Delivery across Kenya via Wells Fargo or G4S',
  '💎 Handcrafted with authentic African Ankara print fabrics'
];

-- Ensure default announcements are set for row 1 if they are empty
UPDATE settings 
SET announcements = ARRAY[
  '✨ FREE SHIPPING IN KENYA | Celebrating African Heritage Through Fashion',
  '🚚 Delivery across Kenya via Wells Fargo or G4S',
  '💎 Handcrafted with authentic African Ankara print fabrics'
]
WHERE id = 1 AND (announcements IS NULL OR cardinality(announcements) = 0);
