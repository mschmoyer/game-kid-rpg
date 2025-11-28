-- Migration: Double enemy HP for longer battles
-- This makes combat more engaging since strength/defense now applies

UPDATE enemy_definitions SET base_hp = base_hp * 2;
