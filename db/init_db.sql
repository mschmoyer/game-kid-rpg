-- Slime Kingdom Database Schema
-- PostgreSQL initialization script

-- Enable UUID extension for unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PLAYERS (Account/Auth)
-- ============================================
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(32) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255), -- For future auth, nullable for now
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    is_online BOOLEAN DEFAULT FALSE
);

-- ============================================
-- CHARACTERS (The Hero)
-- ============================================
CREATE TABLE characters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    name VARCHAR(32) NOT NULL,
    sprite VARCHAR(32) DEFAULT 'knight', -- hero sprite name

    -- Position & Scene
    current_scene VARCHAR(32) DEFAULT 'TownScene',
    pos_x FLOAT DEFAULT 160,
    pos_y FLOAT DEFAULT 160,
    dungeon_floor INTEGER DEFAULT 1,

    -- Core Stats
    level INTEGER DEFAULT 1,
    experience INTEGER DEFAULT 0,

    -- Health
    hp INTEGER DEFAULT 3,
    max_hp INTEGER DEFAULT 3,

    -- Combat Stats (base values before equipment)
    strength INTEGER DEFAULT 1,  -- Base physical power
    defense INTEGER DEFAULT 0,   -- Base defense (before gear)
    magic INTEGER DEFAULT 1,     -- Magic power
    speed INTEGER DEFAULT 1,

    -- Currency
    gold INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT one_character_per_player UNIQUE (player_id)
);

-- ============================================
-- ITEM DEFINITIONS (Item Catalog)
-- ============================================
CREATE TABLE item_definitions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(64) NOT NULL,
    description TEXT,
    sprite VARCHAR(32) NOT NULL, -- sprite frame name
    item_type VARCHAR(32) NOT NULL, -- 'weapon', 'armor', 'accessory', 'consumable', 'key'

    -- Equipment slot (null for consumables/key items)
    slot VARCHAR(32), -- 'weapon', 'shield', 'helmet', 'armor', 'boots', 'accessory'

    -- Stat bonuses (for equipment)
    attack_bonus INTEGER DEFAULT 0,
    defense_bonus INTEGER DEFAULT 0,
    magic_bonus INTEGER DEFAULT 0,
    speed_bonus INTEGER DEFAULT 0,
    max_hp_bonus INTEGER DEFAULT 0,

    -- Consumable effects
    heal_amount INTEGER DEFAULT 0,

    -- Shop info
    buy_price INTEGER DEFAULT 0,
    sell_price INTEGER DEFAULT 0,

    is_stackable BOOLEAN DEFAULT FALSE,
    max_stack INTEGER DEFAULT 1
);

-- ============================================
-- INVENTORY (Items owned by character)
-- ============================================
CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    item_id INTEGER NOT NULL REFERENCES item_definitions(id),
    quantity INTEGER DEFAULT 1,

    CONSTRAINT unique_item_per_character UNIQUE (character_id, item_id)
);

-- ============================================
-- EQUIPMENT (Currently equipped items)
-- ============================================
CREATE TABLE equipment (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    slot VARCHAR(32) NOT NULL, -- 'weapon', 'shield', 'helmet', 'armor', 'boots', 'accessory'
    item_id INTEGER REFERENCES item_definitions(id),

    CONSTRAINT unique_slot_per_character UNIQUE (character_id, slot)
);

-- ============================================
-- GAME SESSIONS (Active multiplayer sessions)
-- ============================================
CREATE TABLE game_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    host_player_id UUID NOT NULL REFERENCES players(id),
    session_code VARCHAR(8) UNIQUE, -- For joining friends
    max_players INTEGER DEFAULT 4,
    current_scene VARCHAR(32) DEFAULT 'TownScene',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- ============================================
-- SESSION PLAYERS (Players in a session)
-- ============================================
CREATE TABLE session_players (
    session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    character_id UUID NOT NULL REFERENCES characters(id),
    socket_id VARCHAR(64), -- Current socket.io connection ID
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    PRIMARY KEY (session_id, player_id)
);

-- ============================================
-- ENEMY DEFINITIONS (Monster Catalog)
-- ============================================
CREATE TABLE enemy_definitions (
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
    min_floor INTEGER DEFAULT 1,  -- First floor this enemy can appear

    -- Attack pattern for parry system
    attack_pattern VARCHAR(32) DEFAULT 'straight',  -- straight, zigzag, pause, fake
    approach_speed INTEGER DEFAULT 600,  -- ms to reach player
    telegraph_blinks INTEGER DEFAULT 2
);

-- ============================================
-- COMBAT LOG (Optional: track battles)
-- ============================================
CREATE TABLE combat_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    enemy_type VARCHAR(32) NOT NULL,
    dungeon_floor INTEGER,
    outcome VARCHAR(16) NOT NULL, -- 'victory', 'defeat'
    experience_gained INTEGER DEFAULT 0,
    gold_gained INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES for performance
-- ============================================
CREATE INDEX idx_characters_player ON characters(player_id);
CREATE INDEX idx_inventory_character ON inventory(character_id);
CREATE INDEX idx_equipment_character ON equipment(character_id);
CREATE INDEX idx_session_players_session ON session_players(session_id);
CREATE INDEX idx_session_players_socket ON session_players(socket_id);
CREATE INDEX idx_combat_log_character ON combat_log(character_id);

-- ============================================
-- SEED DATA: Starting Items
-- ============================================
INSERT INTO item_definitions (name, description, sprite, item_type, slot, attack_bonus, buy_price, sell_price) VALUES
('Wooden Sword', 'A basic wooden training sword.', 'icon-sword', 'weapon', 'weapon', 1, 50, 25),
('Iron Sword', 'A sturdy iron blade.', 'icon-sword', 'weapon', 'weapon', 3, 200, 100),
('Hero Sword', 'A legendary blade of heroes.', 'icon-sword', 'weapon', 'weapon', 5, 500, 250);

INSERT INTO item_definitions (name, description, sprite, item_type, slot, defense_bonus, buy_price, sell_price) VALUES
('Wooden Shield', 'A simple wooden buckler.', 'icon-shield', 'armor', 'shield', 1, 50, 25),
('Iron Shield', 'A solid iron shield.', 'icon-shield', 'armor', 'shield', 3, 200, 100);

INSERT INTO item_definitions (name, description, sprite, item_type, slot, speed_bonus, buy_price, sell_price) VALUES
('Leather Boots', 'Light boots for quick movement.', 'icon-boot', 'armor', 'boots', 1, 75, 35),
('Swift Boots', 'Enchanted boots of speed.', 'icon-boot', 'armor', 'boots', 3, 300, 150);

INSERT INTO item_definitions (name, description, sprite, item_type, heal_amount, is_stackable, max_stack, buy_price, sell_price) VALUES
('Healing Potion', 'Restores 25 HP.', 'icon-heart', 'consumable', 25, TRUE, 10, 25, 10),
('Big Potion', 'Restores full HP.', 'icon-heart', 'consumable', 999, TRUE, 10, 75, 35);

-- Magic Spells (type = 'spell')
INSERT INTO item_definitions (name, description, sprite, item_type, is_stackable, max_stack, buy_price, sell_price) VALUES
('Fire Spark', 'A basic fire spell. Deals magic damage.', 'icon-fire', 'spell', TRUE, 99, 50, 25),
('Ice Shard', 'A basic ice spell. Deals magic damage.', 'icon-ice', 'spell', TRUE, 99, 50, 25),
('Lightning Bolt', 'A powerful lightning spell.', 'icon-lightning', 'spell', TRUE, 99, 150, 75);

-- ============================================
-- SEED DATA: Enemy Definitions
-- ============================================
INSERT INTO enemy_definitions (name, display_name, sprite, base_hp, attack, defense, speed, base_xp, base_gold, min_floor, attack_pattern, approach_speed, telegraph_blinks) VALUES
-- Floor 1: Beginner enemies (HP doubled for longer battles)
('slime', 'Bouncy Slime', 'slime', 6, 2, 0, 1, 10, 5, 1, 'straight', 600, 2),
('bat', 'Flappy Bat', 'bat', 4, 2, 0, 3, 12, 6, 1, 'zigzag', 350, 1),

-- Floor 2+: Moderate enemies
('goblin', 'Grumpy Goblin', 'goblin', 8, 3, 1, 2, 15, 10, 2, 'pause', 500, 2),
('mushroom', 'Silly Mushroom', 'mushroom', 10, 2, 2, 1, 15, 8, 2, 'fake', 800, 3),

-- Floor 4+: Stronger enemies
('skeleton', 'Rattling Skeleton', 'skeleton', 12, 4, 2, 2, 25, 15, 4, 'straight', 450, 2),
('ghost', 'Spooky Ghost', 'ghost', 8, 3, 0, 4, 20, 12, 4, 'fake', 400, 1),

-- Floor 6+: Tough enemies
('orc', 'Big Orc', 'orc', 20, 5, 3, 1, 40, 25, 6, 'pause', 700, 3),
('vampire', 'Sneaky Vampire', 'vampire', 14, 6, 1, 4, 50, 30, 6, 'zigzag', 300, 1),

-- Boss (Floor 10)
('slime-king', 'Slime King', 'slime-king', 40, 6, 3, 2, 100, 100, 10, 'straight', 400, 1);

-- ============================================
-- FUNCTIONS: Auto-update timestamps
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER characters_updated_at
    BEFORE UPDATE ON characters
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
