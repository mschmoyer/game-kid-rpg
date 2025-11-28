-- Add spell items and update healing potion values
-- Run this on existing database to add the new content

-- Update existing Healing Potion to heal 25 HP
UPDATE item_definitions SET heal_amount = 25, description = 'Restores 25 HP.' WHERE name = 'Healing Potion';

-- Update Big Potion to heal to max (999 = full heal)
UPDATE item_definitions SET heal_amount = 999, description = 'Restores full HP.' WHERE name = 'Big Potion';

-- Add spell items (only if they don't exist)
INSERT INTO item_definitions (name, description, sprite, item_type, is_stackable, max_stack, buy_price, sell_price)
SELECT 'Fire Spark', 'A basic fire spell. Deals magic damage.', 'icon-fire', 'spell', TRUE, 99, 50, 25
WHERE NOT EXISTS (SELECT 1 FROM item_definitions WHERE name = 'Fire Spark');

INSERT INTO item_definitions (name, description, sprite, item_type, is_stackable, max_stack, buy_price, sell_price)
SELECT 'Ice Shard', 'A basic ice spell. Deals magic damage.', 'icon-ice', 'spell', TRUE, 99, 50, 25
WHERE NOT EXISTS (SELECT 1 FROM item_definitions WHERE name = 'Ice Shard');

INSERT INTO item_definitions (name, description, sprite, item_type, is_stackable, max_stack, buy_price, sell_price)
SELECT 'Lightning Bolt', 'A powerful lightning spell.', 'icon-lightning', 'spell', TRUE, 99, 150, 75
WHERE NOT EXISTS (SELECT 1 FROM item_definitions WHERE name = 'Lightning Bolt');
