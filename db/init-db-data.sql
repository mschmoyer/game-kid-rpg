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
-- ENEMY DEFINITIONS (using monsters2 sprites)
-- ============================================

-- Clear existing enemies first
DELETE FROM enemy_definitions;

-- Floor 1: Beginner enemy
INSERT INTO enemy_definitions (name, display_name, sprite, base_hp, attack, defense, speed, base_xp, base_gold, min_floor, attack_pattern, approach_speed, telegraph_blinks) VALUES
('slime', 'Gooey Slime', 'slime2', 6, 2, 0, 1, 10, 5, 1, 'straight', 600, 2);

-- Floor 2+: Moderate enemy
INSERT INTO enemy_definitions (name, display_name, sprite, base_hp, attack, defense, speed, base_xp, base_gold, min_floor, attack_pattern, approach_speed, telegraph_blinks) VALUES
('goblin', 'Forest Goblin', 'goblin2', 8, 3, 1, 2, 15, 10, 2, 'pause', 500, 2);

-- Floor 3+: Undead enemy
INSERT INTO enemy_definitions (name, display_name, sprite, base_hp, attack, defense, speed, base_xp, base_gold, min_floor, attack_pattern, approach_speed, telegraph_blinks) VALUES
('skeleton', 'Skeleton Knight', 'skeleton2', 12, 4, 2, 2, 25, 15, 3, 'straight', 450, 2);

-- Floor 4+: Beast enemy
INSERT INTO enemy_definitions (name, display_name, sprite, base_hp, attack, defense, speed, base_xp, base_gold, min_floor, attack_pattern, approach_speed, telegraph_blinks) VALUES
('wolf', 'Shadow Wolf', 'wolf2', 14, 5, 1, 4, 35, 20, 4, 'dash', 350, 1);

-- Floor 5+: Boss-tier enemy
INSERT INTO enemy_definitions (name, display_name, sprite, base_hp, attack, defense, speed, base_xp, base_gold, min_floor, attack_pattern, approach_speed, telegraph_blinks) VALUES
('dragon', 'Fire Dragon', 'dragon2', 30, 6, 3, 2, 75, 50, 5, 'tripleShot', 500, 3);
