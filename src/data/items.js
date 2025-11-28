/**
 * Item Definitions for Slime Kingdom
 * Client-side reference for item data (server is source of truth)
 */

// Item type constants
export const ITEM_TYPES = {
    WEAPON: 'weapon',
    ARMOR: 'armor',
    CONSUMABLE: 'consumable',
    SPELL: 'spell',
    KEY: 'key'
};

// Equipment slot constants
export const EQUIP_SLOTS = {
    WEAPON: 'weapon',
    SHIELD: 'shield',
    HELMET: 'helmet',
    ARMOR: 'armor',
    BOOTS: 'boots',
    ACCESSORY: 'accessory'
};

// Shop categories for UI
export const SHOP_CATEGORIES = [
    { id: 'weapons', name: 'Weapons', icon: '⚔️', filter: (item) => item.itemType === 'weapon' },
    { id: 'armor', name: 'Armor', icon: '🛡️', filter: (item) => item.itemType === 'armor' },
    { id: 'items', name: 'Items', icon: '🧪', filter: (item) => item.itemType === 'consumable' }
];

/**
 * Get icon sprite for an item based on its type/slot
 */
export function getItemIcon(item) {
    if (item.itemType === 'weapon') return 'icon-sword';
    if (item.slot === 'boots') return 'icon-boot';
    if (item.itemType === 'armor') return 'icon-shield';
    if (item.manaRestore > 0 && item.healAmount === 0) return 'icon-star';
    if (item.healAmount > 0) return 'icon-heart';
    return 'icon-coin';
}

/**
 * Get stat description for an item
 */
export function getItemStats(item) {
    const stats = [];

    if (item.attackBonus > 0) stats.push(`ATK +${item.attackBonus}`);
    if (item.defenseBonus > 0) stats.push(`DEF +${item.defenseBonus}`);
    if (item.magicBonus > 0) stats.push(`MAG +${item.magicBonus}`);
    if (item.speedBonus > 0) stats.push(`SPD +${item.speedBonus}`);
    if (item.maxHpBonus > 0) stats.push(`HP +${item.maxHpBonus}`);
    if (item.healAmount > 0) {
        stats.push(item.healAmount >= 999 ? 'Full HP' : `+${item.healAmount} HP`);
    }
    if (item.manaRestore > 0) {
        stats.push(item.manaRestore >= 999 ? 'Full MP' : `+${item.manaRestore} MP`);
    }

    return stats.join(', ') || 'No stats';
}

/**
 * Format gold amount with icon
 */
export function formatGold(amount) {
    return `${amount}G`;
}
