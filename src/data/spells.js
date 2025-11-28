/**
 * Spell Definitions
 * These are the spells players can learn and cast.
 * Spells are learned automatically when the player reaches the required level.
 */

export const SPELL_DEFINITIONS = {
    'fire-spark': {
        id: 'fire-spark',
        name: 'Fire Spark',
        description: 'A quick burst of flame.',
        sprite: 'icon-fire',
        levelRequired: 3,
        mpCost: 3,
        canUseInCombat: true,
        canUseOutsideCombat: false,
        effectType: 'damage',
        baseDamage: 5,
        magicScaling: 0.5,  // damage = baseDamage + (magic * magicScaling)
        healAmount: 0
    },
    'heal': {
        id: 'heal',
        name: 'Heal',
        description: 'Restore HP with healing magic.',
        sprite: 'icon-heart',
        levelRequired: 5,
        mpCost: 5,
        canUseInCombat: true,
        canUseOutsideCombat: true,
        effectType: 'heal',
        baseDamage: 0,
        magicScaling: 1.0,  // heal = baseHeal + (magic * magicScaling)
        healAmount: 15
    },
    'return': {
        id: 'return',
        name: 'Return',
        description: 'Instantly teleport back to town.',
        sprite: 'icon-star',
        levelRequired: 8,
        mpCost: 5,
        canUseInCombat: false,
        canUseOutsideCombat: true,
        effectType: 'teleport',
        baseDamage: 0,
        magicScaling: 0,
        healAmount: 0
    }
};

/**
 * Get all spells a player has learned based on their level
 * @param {number} playerLevel - The player's current level
 * @returns {Array} Array of spell objects the player can use
 */
export function getLearnedSpells(playerLevel) {
    return Object.values(SPELL_DEFINITIONS)
        .filter(spell => playerLevel >= spell.levelRequired)
        .sort((a, b) => a.levelRequired - b.levelRequired);
}

/**
 * Get spells available for combat
 * @param {number} playerLevel - The player's current level
 * @returns {Array} Array of combat-usable spells
 */
export function getCombatSpells(playerLevel) {
    return getLearnedSpells(playerLevel)
        .filter(spell => spell.canUseInCombat);
}

/**
 * Get spells available outside combat (in menu)
 * @param {number} playerLevel - The player's current level
 * @returns {Array} Array of spells usable outside combat
 */
export function getOutOfCombatSpells(playerLevel) {
    return getLearnedSpells(playerLevel)
        .filter(spell => spell.canUseOutsideCombat);
}

/**
 * Calculate actual damage/heal amount including magic scaling
 * @param {Object} spell - The spell definition
 * @param {number} magicStat - The player's magic stat
 * @returns {number} The calculated damage or heal amount
 */
export function calculateSpellPower(spell, magicStat) {
    if (spell.effectType === 'damage') {
        return Math.floor(spell.baseDamage + (magicStat * spell.magicScaling));
    } else if (spell.effectType === 'heal') {
        return Math.floor(spell.healAmount + (magicStat * spell.magicScaling));
    }
    return 0;
}

/**
 * Get the next spell the player will learn (if any)
 * @param {number} playerLevel - The player's current level
 * @returns {Object|null} The next spell to learn, or null if all learned
 */
export function getNextSpellToLearn(playerLevel) {
    const notLearned = Object.values(SPELL_DEFINITIONS)
        .filter(spell => playerLevel < spell.levelRequired)
        .sort((a, b) => a.levelRequired - b.levelRequired);

    return notLearned.length > 0 ? notLearned[0] : null;
}
