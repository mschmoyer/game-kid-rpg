-- Migration: Add enemy definitions table and rename attack to strength

-- Rename attack to strength in characters table
ALTER TABLE characters RENAME COLUMN attack TO strength;

-- Create enemy_definitions table
CREATE TABLE IF NOT EXISTS enemy_definitions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(64) NOT NULL,
    display_name VARCHAR(64) NOT NULL,
    sprite VARCHAR(32) NOT NULL,

    -- Base Stats
    base_hp INTEGER DEFAULT 3,
    attack INTEGER DEFAULT 1,
    defense INTEGER DEFAULT 0,
    speed INTEGER DEFAULT 1,

    -- Rewards
    base_xp INTEGER DEFAULT 10,
    base_gold INTEGER DEFAULT 5,

    -- Encounter settings
    min_floor INTEGER DEFAULT 1,

    -- Attack pattern for parry system
    attack_pattern VARCHAR(32) DEFAULT 'straight',
    approach_speed INTEGER DEFAULT 600,
    telegraph_blinks INTEGER DEFAULT 2
);

-- Seed enemy data (only if table is empty)
-- NOTE: Only enemies with sprites in monsters.json are included
-- HP doubled for longer battles
INSERT INTO enemy_definitions (name, display_name, sprite, base_hp, attack, defense, speed, base_xp, base_gold, min_floor, attack_pattern, approach_speed, telegraph_blinks)
SELECT * FROM (VALUES
    -- Floor 1: Beginner enemies
    ('slime', 'Bouncy Slime', 'slime', 6, 2, 0, 1, 10, 5, 1, 'straight', 600, 2),
    ('bat', 'Flappy Bat', 'bat', 4, 2, 0, 3, 12, 6, 1, 'projectile', 350, 1),

    -- Floor 2+: Moderate enemies
    ('goblin', 'Grumpy Goblin', 'goblin', 8, 3, 1, 2, 15, 10, 2, 'pause', 500, 2),
    ('mushroom', 'Silly Mushroom', 'mushroom', 10, 2, 2, 1, 15, 8, 2, 'fake', 800, 3),

    -- Boss (Floor 10)
    ('slime-king', 'Slime King', 'slime-king', 40, 6, 3, 2, 100, 100, 10, 'straight', 400, 1)
) AS v(name, display_name, sprite, base_hp, attack, defense, speed, base_xp, base_gold, min_floor, attack_pattern, approach_speed, telegraph_blinks)
WHERE NOT EXISTS (SELECT 1 FROM enemy_definitions LIMIT 1);
