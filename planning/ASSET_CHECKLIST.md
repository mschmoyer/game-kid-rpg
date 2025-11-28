# Slime Kingdom - SVG Asset Checklist

A comprehensive list of all SVG graphics needed to complete the MVP.

---

## Asset Summary

| Category | Completed | Remaining | Total |
|----------|-----------|-----------|-------|
| Monsters | 5 | 0 | 5 |
| Gear | 5 | 4 | 9 |
| Heroes | 0 | 3 | 3 |
| Items/Consumables | 0 | 6 | 6 |
| Town Tiles | 0 | 12 | 12 |
| Dungeon Tiles | 0 | 10 | 10 |
| UI Elements | 0 | 15 | 15 |
| Effects/VFX | 0 | 8 | 8 |
| NPCs | 0 | 4 | 4 |
| **TOTAL** | **10** | **62** | **72** |

---

## 1. MONSTERS ✅ Complete

Location: `/sprites/monsters/`

| Asset | File | Size | Status |
|-------|------|------|--------|
| Slime | `slime.svg` | 64x64 | ✅ Done |
| Bat | `bat.svg` | 64x64 | ✅ Done |
| Goblin | `goblin.svg` | 64x64 | ✅ Done |
| Mushroom | `mushroom.svg` | 64x64 | ✅ Done |
| Slime King (Boss) | `slime-king.svg` | 96x96 | ✅ Done |

---

## 2. GEAR (Equipment)

Location: `/sprites/gear/`

### Weapons
| Asset | File | Size | Status | Stats |
|-------|------|------|--------|-------|
| Wooden Sword | `wooden-sword.svg` | 32x32 | ✅ Done | +2 ATK |
| Iron Sword | `iron-sword.svg` | 32x32 | ✅ Done | +5 ATK |
| Hero Blade | `hero-blade.svg` | 32x32 | ⬜ TODO | +8 ATK |
| Magic Staff | `magic-staff.svg` | 32x32 | ✅ Done | +3 MAG |

### Armor
| Asset | File | Size | Status | Stats |
|-------|------|------|--------|-------|
| Cloth Tunic | `cloth-tunic.svg` | 32x32 | ⬜ TODO | +1 DEF |
| Leather Armor | `leather-armor.svg` | 32x32 | ⬜ TODO | +3 DEF |
| Chain Mail | `chain-mail.svg` | 32x32 | ✅ Done | +6 DEF |

### Accessories
| Asset | File | Size | Status | Stats |
|-------|------|------|--------|-------|
| Lucky Charm | `lucky-charm.svg` | 32x32 | ✅ Done | +10% Gold |
| Speed Ring | `speed-ring.svg` | 32x32 | ⬜ TODO | +2 SPD |
| Slime Crown | `slime-crown.svg` | 32x32 | ⬜ TODO | +5 All (Boss Drop) |

---

## 3. HERO CHARACTERS

Location: `/sprites/heroes/`

Each hero needs a single portrait/sprite for now. Animation frames can come later.

| Asset | File | Size | Status | Description |
|-------|------|------|--------|-------------|
| Knight | `knight.svg` | 64x64 | ⬜ TODO | Blue armor, sword, brown hair |
| Mage | `mage.svg` | 64x64 | ⬜ TODO | Red robe, staff, blonde hair |
| Healer | `healer.svg` | 64x64 | ⬜ TODO | White/green robe, gentle expression |

---

## 4. ITEMS & CONSUMABLES

Location: `/sprites/items/`

| Asset | File | Size | Status | Effect |
|-------|------|------|--------|--------|
| Health Potion | `potion-health.svg` | 32x32 | ⬜ TODO | Restore 20 HP |
| Magic Potion | `potion-magic.svg` | 32x32 | ⬜ TODO | Restore 10 MP |
| Antidote | `antidote.svg` | 32x32 | ⬜ TODO | Cure poison |
| Dungeon Key | `key.svg` | 32x32 | ⬜ TODO | Opens locked doors |
| Treasure Chest | `chest-closed.svg` | 32x32 | ⬜ TODO | Loot container |
| Treasure Chest (Open) | `chest-open.svg` | 32x32 | ⬜ TODO | Opened state |

---

## 5. TOWN TILES

Location: `/sprites/tiles/town/`

### Ground Tiles (32x32 each)
| Asset | File | Status | Description |
|-------|------|--------|-------------|
| Grass | `grass.svg` | ⬜ TODO | Base green tile with texture |
| Path | `path.svg` | ⬜ TODO | Dirt/cobblestone walkway |
| Water | `water.svg` | ⬜ TODO | Pond/river tile |
| Flowers | `flowers.svg` | ⬜ TODO | Decorative grass with flowers |

### Buildings (64x64 or larger)
| Asset | File | Size | Status | Description |
|-------|------|------|--------|-------------|
| Inn | `building-inn.svg` | 96x96 | ⬜ TODO | Red roof, cozy lodge |
| Shop | `building-shop.svg` | 96x96 | ⬜ TODO | Blue roof, market stall |
| Fountain | `fountain.svg` | 64x64 | ⬜ TODO | Stone fountain, centerpiece |
| Cave Entrance | `cave-entrance.svg` | 64x64 | ⬜ TODO | Rocky entrance to dungeon |

### Props (32x32 each)
| Asset | File | Status | Description |
|-------|------|--------|-------------|
| Sign Post | `sign-post.svg` | ⬜ TODO | Wooden directional sign |
| Barrel | `barrel.svg` | ⬜ TODO | Wooden storage barrel |
| Crate | `crate.svg` | ⬜ TODO | Wooden supply crate |
| Lantern | `lantern.svg` | ⬜ TODO | Street lamp/torch |

---

## 6. DUNGEON TILES

Location: `/sprites/tiles/dungeon/`

### Floor & Walls (32x32 each)
| Asset | File | Status | Description |
|-------|------|--------|-------------|
| Floor Stone | `floor-stone.svg` | ⬜ TODO | Basic dungeon floor |
| Wall Stone | `wall-stone.svg` | ⬜ TODO | Solid cave wall |
| Wall Corner | `wall-corner.svg` | ⬜ TODO | Corner piece |
| Door Closed | `door-closed.svg` | ⬜ TODO | Wooden door |
| Door Open | `door-open.svg` | ⬜ TODO | Opened door state |
| Stairs Down | `stairs-down.svg` | ⬜ TODO | Go to next floor |
| Stairs Up | `stairs-up.svg` | ⬜ TODO | Return to previous floor |

### Props (32x32 each)
| Asset | File | Status | Description |
|-------|------|--------|-------------|
| Torch (Wall) | `torch-wall.svg` | ⬜ TODO | Mounted torch for lighting |
| Bones | `bones.svg` | ⬜ TODO | Skeletal remains decor |
| Rubble | `rubble.svg` | ⬜ TODO | Fallen rocks/debris |

---

## 7. UI ELEMENTS

Location: `/sprites/ui/`

### Menu Components
| Asset | File | Size | Status | Description |
|-------|------|------|--------|-------------|
| Button Normal | `btn-normal.svg` | 64x24 | ⬜ TODO | Default button state |
| Button Hover | `btn-hover.svg` | 64x24 | ⬜ TODO | Highlighted state |
| Button Pressed | `btn-pressed.svg` | 64x24 | ⬜ TODO | Clicked state |
| Panel Background | `panel-bg.svg` | 128x128 | ⬜ TODO | 9-slice dialog box |
| Cursor | `cursor.svg` | 16x16 | ⬜ TODO | Menu selection arrow |

### HUD Icons (24x24 each)
| Asset | File | Status | Description |
|-------|------|--------|-------------|
| Heart (HP) | `icon-heart.svg` | ⬜ TODO | Health indicator |
| Star (MP) | `icon-star.svg` | ⬜ TODO | Magic/sparkle indicator |
| Coin (Gold) | `icon-coin.svg` | ⬜ TODO | Currency indicator |
| Sword (ATK) | `icon-sword.svg` | ⬜ TODO | Attack stat |
| Shield (DEF) | `icon-shield.svg` | ⬜ TODO | Defense stat |
| Boot (SPD) | `icon-boot.svg` | ⬜ TODO | Speed stat |

### Combat UI
| Asset | File | Size | Status | Description |
|-------|------|------|--------|-------------|
| Action: Attack | `action-attack.svg` | 48x48 | ⬜ TODO | Sword icon for BONK |
| Action: Magic | `action-magic.svg` | 48x48 | ⬜ TODO | Sparkle icon for MAGIC |
| Action: Item | `action-item.svg` | 48x48 | ⬜ TODO | Bag icon for ITEM |
| Action: Guard | `action-guard.svg` | 48x48 | ⬜ TODO | Shield icon for GUARD |

---

## 8. EFFECTS & VFX

Location: `/sprites/effects/`

| Asset | File | Size | Status | Description |
|-------|------|------|--------|-------------|
| Slash Effect | `fx-slash.svg` | 64x64 | ⬜ TODO | Sword swing arc |
| Magic Sparkle | `fx-sparkle.svg` | 64x64 | ⬜ TODO | Spell casting effect |
| Heal Effect | `fx-heal.svg` | 64x64 | ⬜ TODO | Green healing glow |
| Hit Effect | `fx-hit.svg` | 32x32 | ⬜ TODO | Impact stars/burst |
| Level Up | `fx-levelup.svg` | 96x96 | ⬜ TODO | Celebration burst |
| Poison Bubble | `fx-poison.svg` | 32x32 | ⬜ TODO | Purple toxic bubbles |
| Sleep Zzz | `fx-sleep.svg` | 32x32 | ⬜ TODO | Floating Z letters |
| Miss/Dodge | `fx-miss.svg` | 32x32 | ⬜ TODO | "MISS" text effect |

---

## 9. NPCs (Non-Player Characters)

Location: `/sprites/npcs/`

| Asset | File | Size | Status | Description |
|-------|------|------|--------|-------------|
| Innkeeper | `npc-innkeeper.svg` | 64x64 | ⬜ TODO | Friendly woman, apron |
| Shopkeeper | `npc-shopkeeper.svg` | 64x64 | ⬜ TODO | Merchant with mustache |
| Elder Sage | `npc-elder.svg` | 64x64 | ⬜ TODO | Old wizard, purple robe |
| Cat | `npc-cat.svg` | 32x32 | ⬜ TODO | Orange wandering cat |

---

## Production Priority

### Phase 1 - Core Gameplay (Must Have)
1. ⬜ Hero sprites (3) - Need characters to play!
2. ⬜ UI action icons (4) - Combat menu buttons
3. ⬜ HUD icons (6) - Stats display
4. ⬜ Health/Magic potions (2) - Basic items
5. ⬜ Basic effects (slash, hit, heal) - Combat feedback

### Phase 2 - World Building (Should Have)
6. ⬜ Town tiles (8) - Ground, buildings
7. ⬜ Dungeon tiles (7) - Floors, walls, doors
8. ⬜ NPCs (4) - Town inhabitants
9. ⬜ Remaining gear (4) - Complete equipment set

### Phase 3 - Polish (Nice to Have)
10. ⬜ Additional effects (5) - Level up, status effects
11. ⬜ Props and decorations (6) - Barrels, signs, etc.
12. ⬜ Menu UI elements (5) - Buttons, panels
13. ⬜ Chest open/closed states

---

## Style Guidelines

### Color Palette
Keep consistent with existing sprites:
- **Greens:** #228b22, #32cd32, #7fff7f (slimes, nature)
- **Blues:** #4169e1, #4dabf7, #228be6 (knight, magic, water)
- **Reds:** #dc143c, #ff6b6b (mage, damage, health)
- **Golds:** #ffd700, #daa520, #b8860b (coins, UI accents)
- **Purples:** #4a3a5a, #6a5a7a (cave/dungeon, mystery)
- **Earth:** #8b6914, #654321 (wood, leather)

### Sizing Convention
- **Characters:** 64x64 (heroes, NPCs, monsters)
- **Boss:** 96x96 (Slime King)
- **Items/Icons:** 32x32 (inventory, small props)
- **UI Icons:** 24x24 (HUD stats)
- **Action Buttons:** 48x48 (combat menu)
- **Tiles:** 32x32 (ground, walls)
- **Buildings:** 64x64 to 96x96

### Visual Style
- Soft gradients for shading (not flat colors)
- White highlight spots for shine/gloss
- Drop shadows for depth
- Friendly expressions (even on enemies)
- Bold outlines for clarity
- High contrast for young players

---

## File Naming Convention

```
{category}-{name}.svg

Examples:
- monster-slime.svg
- gear-iron-sword.svg
- tile-grass.svg
- ui-btn-normal.svg
- fx-slash.svg
- npc-shopkeeper.svg
```

---

*Last updated: Session 1*
*Total assets: 72 | Completed: 10 | Remaining: 62*
