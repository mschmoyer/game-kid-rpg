-- Migration: Add shop items
-- Adds new consumables, armor, and helmets for the shop

-- ============================================
-- NEW CONSUMABLES
-- ============================================

-- Mana Potion - restores 10 MP
INSERT INTO item_definitions (name, description, sprite, item_type, heal_amount, is_stackable, max_stack, buy_price, sell_price) VALUES
('Mana Potion', 'Restores 10 MP.', 'icon-star', 'consumable', 0, TRUE, 10, 30, 12)
ON CONFLICT DO NOTHING;

-- Big Mana Potion - restores full MP
INSERT INTO item_definitions (name, description, sprite, item_type, heal_amount, is_stackable, max_stack, buy_price, sell_price) VALUES
('Big Mana Potion', 'Restores full MP.', 'icon-star', 'consumable', 0, TRUE, 10, 80, 35)
ON CONFLICT DO NOTHING;

-- Elixir - restores both HP and MP (we'll handle this specially in code)
INSERT INTO item_definitions (name, description, sprite, item_type, heal_amount, is_stackable, max_stack, buy_price, sell_price) VALUES
('Elixir', 'Restores 20 HP and 10 MP.', 'icon-heart', 'consumable', 20, TRUE, 10, 100, 45)
ON CONFLICT DO NOTHING;

-- ============================================
-- ARMOR (Body armor - uses 'armor' slot)
-- ============================================
INSERT INTO item_definitions (name, description, sprite, item_type, slot, defense_bonus, buy_price, sell_price) VALUES
('Leather Armor', 'Basic leather protection.', 'icon-shield', 'armor', 'armor', 2, 100, 50),
('Iron Armor', 'Solid iron plating.', 'icon-shield', 'armor', 'armor', 4, 350, 175),
('Steel Armor', 'Superior steel protection.', 'icon-shield', 'armor', 'armor', 6, 600, 300)
ON CONFLICT DO NOTHING;

-- ============================================
-- HELMETS (uses 'helmet' slot)
-- ============================================
INSERT INTO item_definitions (name, description, sprite, item_type, slot, defense_bonus, buy_price, sell_price) VALUES
('Leather Helm', 'A simple leather cap.', 'icon-shield', 'armor', 'helmet', 1, 60, 30),
('Iron Helm', 'A sturdy iron helmet.', 'icon-shield', 'armor', 'helmet', 2, 200, 100),
('Steel Helm', 'A fine steel helmet.', 'icon-shield', 'armor', 'helmet', 4, 450, 225)
ON CONFLICT DO NOTHING;

-- ============================================
-- Add mana_restore column for mana potions
-- ============================================
ALTER TABLE item_definitions
ADD COLUMN IF NOT EXISTS mana_restore INTEGER DEFAULT 0;

-- Update mana potions with mana_restore values
UPDATE item_definitions SET mana_restore = 10 WHERE name = 'Mana Potion';
UPDATE item_definitions SET mana_restore = 999 WHERE name = 'Big Mana Potion';
UPDATE item_definitions SET mana_restore = 10 WHERE name = 'Elixir';

-- Update the Prisma schema comment: mana_restore field added
-- Run: npx prisma db pull && npx prisma generate
