-- Migration: Add MP (Mana Points) and Statistics tracking
-- Run this after init_db.sql

-- ============================================
-- ADD MP FIELDS TO CHARACTERS
-- ============================================
ALTER TABLE characters
ADD COLUMN IF NOT EXISTS mp INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS max_mp INTEGER DEFAULT 10;

-- ============================================
-- ADD STATISTICS FIELDS TO CHARACTERS
-- ============================================
ALTER TABLE characters
ADD COLUMN IF NOT EXISTS monsters_killed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS battles_won INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS battles_lost INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS times_fled INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS damage_dealt INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS damage_taken INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS successful_parries INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS spells_cast INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS items_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS gold_earned INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS deepest_floor INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS play_time_seconds INTEGER DEFAULT 0;

-- ============================================
-- SPELL DEFINITIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS spell_definitions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(64) NOT NULL UNIQUE,
    description TEXT,
    sprite VARCHAR(32) NOT NULL,

    -- Learning requirements
    level_required INTEGER DEFAULT 1,

    -- MP cost
    mp_cost INTEGER DEFAULT 5,

    -- Where can it be cast?
    can_use_in_combat BOOLEAN DEFAULT TRUE,
    can_use_outside_combat BOOLEAN DEFAULT FALSE,

    -- Effects
    damage INTEGER DEFAULT 0,           -- For offensive spells
    heal_amount INTEGER DEFAULT 0,      -- For healing spells
    effect_type VARCHAR(32) DEFAULT 'damage', -- damage, heal, teleport, buff

    -- Scaling (added to base based on magic stat)
    magic_scaling FLOAT DEFAULT 0.5     -- damage/heal = base + (magic * scaling)
);

-- ============================================
-- SEED DATA: Spell Definitions
-- ============================================
INSERT INTO spell_definitions (name, description, sprite, level_required, mp_cost, can_use_in_combat, can_use_outside_combat, damage, heal_amount, effect_type, magic_scaling) VALUES
('Fire Spark', 'A quick burst of flame.', 'icon-fire', 3, 3, TRUE, FALSE, 5, 0, 'damage', 0.5),
('Heal', 'Restore HP with healing magic.', 'icon-heart', 5, 5, TRUE, TRUE, 0, 15, 'heal', 1.0),
('Return', 'Instantly teleport back to town.', 'icon-star', 8, 5, FALSE, TRUE, 0, 0, 'teleport', 0)
ON CONFLICT (name) DO UPDATE SET
    level_required = EXCLUDED.level_required,
    mp_cost = EXCLUDED.mp_cost,
    can_use_in_combat = EXCLUDED.can_use_in_combat,
    can_use_outside_combat = EXCLUDED.can_use_outside_combat,
    damage = EXCLUDED.damage,
    heal_amount = EXCLUDED.heal_amount,
    effect_type = EXCLUDED.effect_type,
    magic_scaling = EXCLUDED.magic_scaling;

-- ============================================
-- UPDATE EXISTING CHARACTERS
-- ============================================
-- Set MP = maxMp for existing characters
UPDATE characters SET mp = max_mp WHERE mp IS NULL OR mp = 0;
