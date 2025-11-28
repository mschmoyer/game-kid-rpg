-- Slime Kingdom Seed Data
-- Run this after schema creation to populate initial game data
-- Usage: psql -h localhost -U postgres -d slime_kingdom -f db/init-db-data.sql
-- Or on Heroku: heroku run "cat db/init-db-data.sql | npx prisma db execute --stdin"

-- ============================================
-- Clear existing data (optional, uncomment if needed)
-- ============================================
-- TRUNCATE TABLE enemy_definitions RESTART IDENTITY CASCADE;
-- TRUNCATE TABLE item_definitions RESTART IDENTITY CASCADE;

-- ============================================
-- ITEM DEFINITIONS
-- ============================================

-- Weapons
INSERT INTO item_definitions (name, description, sprite, item_type, slot, attack_bonus, buy_price, sell_price) VALUES
('Wooden Sword', 'A basic wooden training sword.', 'icon-sword', 'weapon', 'weapon', 1, 50, 25),
('Iron Sword', 'A sturdy iron blade.', 'icon-sword', 'weapon', 'weapon', 3, 200, 100),
('Hero Sword', 'A legendary blade of heroes.', 'icon-sword', 'weapon', 'weapon', 5, 500, 250)
ON CONFLICT DO NOTHING;

-- Shields
INSERT INTO item_definitions (name, description, sprite, item_type, slot, defense_bonus, buy_price, sell_price) VALUES
('Wooden Shield', 'A simple wooden buckler.', 'icon-shield', 'armor', 'shield', 1, 50, 25),
('Iron Shield', 'A solid iron shield.', 'icon-shield', 'armor', 'shield', 3, 200, 100)
ON CONFLICT DO NOTHING;

-- Boots
INSERT INTO item_definitions (name, description, sprite, item_type, slot, speed_bonus, buy_price, sell_price) VALUES
('Leather Boots', 'Light boots for quick movement.', 'icon-boot', 'armor', 'boots', 1, 75, 35),
('Swift Boots', 'Enchanted boots of speed.', 'icon-boot', 'armor', 'boots', 3, 300, 150)
ON CONFLICT DO NOTHING;

-- Consumables
INSERT INTO item_definitions (name, description, sprite, item_type, heal_amount, is_stackable, max_stack, buy_price, sell_price) VALUES
('Healing Potion', 'Restores 25 HP.', 'icon-heart', 'consumable', 25, TRUE, 10, 25, 10),
('Big Potion', 'Restores full HP.', 'icon-heart', 'consumable', 999, TRUE, 10, 75, 35)
ON CONFLICT DO NOTHING;

-- Spells
INSERT INTO item_definitions (name, description, sprite, item_type, is_stackable, max_stack, buy_price, sell_price) VALUES
('Fire Spark', 'A basic fire spell. Deals magic damage.', 'icon-fire', 'spell', TRUE, 99, 50, 25),
('Ice Shard', 'A basic ice spell. Deals magic damage.', 'icon-ice', 'spell', TRUE, 99, 50, 25),
('Lightning Bolt', 'A powerful lightning spell.', 'icon-lightning', 'spell', TRUE, 99, 150, 75)
ON CONFLICT DO NOTHING;

-- ============================================
-- ENEMY DEFINITIONS
-- ============================================

-- Floor 1: Beginner enemies
INSERT INTO enemy_definitions (name, display_name, sprite, base_hp, attack, defense, speed, base_xp, base_gold, min_floor, attack_pattern, approach_speed, telegraph_blinks) VALUES
('slime', 'Bouncy Slime', 'slime', 6, 2, 0, 1, 10, 5, 1, 'straight', 600, 2),
('bat', 'Flappy Bat', 'bat', 4, 2, 0, 3, 12, 6, 1, 'zigzag', 350, 1)
ON CONFLICT DO NOTHING;

-- Floor 2+: Moderate enemies
INSERT INTO enemy_definitions (name, display_name, sprite, base_hp, attack, defense, speed, base_xp, base_gold, min_floor, attack_pattern, approach_speed, telegraph_blinks) VALUES
('goblin', 'Grumpy Goblin', 'goblin', 8, 3, 1, 2, 15, 10, 2, 'pause', 500, 2),
('mushroom', 'Silly Mushroom', 'mushroom', 10, 2, 2, 1, 15, 8, 2, 'fake', 800, 3)
ON CONFLICT DO NOTHING;

-- Floor 4+: Stronger enemies
INSERT INTO enemy_definitions (name, display_name, sprite, base_hp, attack, defense, speed, base_xp, base_gold, min_floor, attack_pattern, approach_speed, telegraph_blinks) VALUES
('skeleton', 'Rattling Skeleton', 'skeleton', 12, 4, 2, 2, 25, 15, 4, 'straight', 450, 2),
('ghost', 'Spooky Ghost', 'ghost', 8, 3, 0, 4, 20, 12, 4, 'fake', 400, 1)
ON CONFLICT DO NOTHING;

-- Floor 6+: Tough enemies
INSERT INTO enemy_definitions (name, display_name, sprite, base_hp, attack, defense, speed, base_xp, base_gold, min_floor, attack_pattern, approach_speed, telegraph_blinks) VALUES
('orc', 'Big Orc', 'orc', 20, 5, 3, 1, 40, 25, 6, 'pause', 700, 3),
('vampire', 'Sneaky Vampire', 'vampire', 14, 6, 1, 4, 50, 30, 6, 'zigzag', 300, 1)
ON CONFLICT DO NOTHING;

-- Boss (Floor 10)
INSERT INTO enemy_definitions (name, display_name, sprite, base_hp, attack, defense, speed, base_xp, base_gold, min_floor, attack_pattern, approach_speed, telegraph_blinks) VALUES
('slime-king', 'Slime King', 'slime-king', 40, 6, 3, 2, 100, 100, 10, 'straight', 400, 1)
ON CONFLICT DO NOTHING;
