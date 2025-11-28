# Combat Scene Guide

## Overview
The CombatScene is a turn-based combat system for "Slime Kingdom" featuring kid-friendly battles with cute monsters.

## File Location
`/Users/mike.schmoyer/Documents/GitHub/game-kid-rpg/src/scenes/CombatScene.js`

## How to Launch Combat

From any scene, you can start a combat encounter like this:

```javascript
// Basic combat with a slime
this.scene.start('CombatScene', {
    enemy: 'slime',
    returnScene: 'TownScene'  // Scene to return to after combat
});

// Other available enemies from monsters atlas:
// - 'slime' (default)
// - 'bat'
// - 'goblin'
// - 'mushroom'
// - 'slime-king'
```

## Example: Add Combat to TownScene

To add a test combat trigger to TownScene, add this to the `create()` method:

```javascript
// Add a test enemy trigger (press E to fight)
this.input.keyboard.on('keydown-E', () => {
    console.log('Starting combat!');
    this.scene.start('CombatScene', {
        enemy: 'slime',
        returnScene: 'TownScene'
    });
});

// Add instructions
this.add.text(160, 264, 'Press E to test combat!', {
    font: '8px monospace',
    fill: '#ffff00'
}).setOrigin(0.5, 0.5);
```

## Controls

### During Combat:
- **Left/Right Arrow** or **A/D**: Move selection between action buttons
- **Space** or **Enter**: Confirm selected action

### Actions:
1. **Attack**: Deal 1 damage with a slash effect
2. **Magic**: Deal 1 damage with sparkle effect
3. **Item**: Heal player by 1 heart (uses potion)
4. **Guard**: Defensive stance (currently just skips turn, can be enhanced)

## Combat Flow

1. Player's turn - choose an action
2. Player action executes with visual effects
3. Enemy takes damage or player heals
4. If enemy defeated: "Victory!" message, return to previous scene
5. If enemy survives: Enemy attacks player
6. Player takes damage
7. If player defeated: "Bonked!" message, return to TownScene
8. If player survives: Back to player's turn

## Health System

- **Player**: 3 hearts (max)
- **Enemy**: 2 hearts (max)
- Hearts shown at top of screen
- Dimmed hearts indicate lost health

## Visual Effects

All effects from the `effects` atlas:
- **slash**: Physical attack effect
- **hit**: Damage indicator
- **heal**: Healing sparkles
- **sparkle**: Magic effect
- **miss**: (available but not used in MVP)

## Kid-Friendly Features

- No "death" - players get "Bonked!" instead
- Cute enemy names (Bouncy Slime, Flappy Bat, etc.)
- Colorful visual effects
- No penalties for losing
- Encouraging messages

## Customization Ideas

### Easy Enhancements:
1. **Different enemy stats**: Modify `enemyMaxHealth` based on enemy type
2. **Stronger attacks**: Change damage values in action methods
3. **Guard effect**: Implement damage reduction on next hit
4. **Miss chance**: Add random miss probability
5. **Enemy variety**: Different attack patterns per enemy type
6. **Rewards**: Give items/coins on victory
7. **Experience**: Add XP system
8. **Sound effects**: Add audio to actions and effects

### Example - Different Enemy Stats:
```javascript
init(data) {
    this.enemyType = data.enemy || 'slime';

    // Set health based on enemy type
    const enemyStats = {
        'slime': 2,
        'bat': 2,
        'goblin': 3,
        'mushroom': 2,
        'slime-king': 5
    };

    this.enemyMaxHealth = enemyStats[this.enemyType] || 2;
    this.enemyHealth = this.enemyMaxHealth;
}
```

## Testing

To test the combat scene:

1. Run the dev server: `npm run dev`
2. Add a combat trigger to TownScene (see example above)
3. Press E in town to start combat
4. Try all four actions
5. Test both victory and defeat scenarios

## Scene Data Parameters

- `enemy` (string): Enemy sprite frame name from monsters atlas (default: 'slime')
- `returnScene` (string): Scene to return to after combat (default: 'TownScene')

## Current Limitations (MVP)

- All attacks deal 1 damage
- Guard action doesn't reduce damage
- No experience/leveling system
- No loot/rewards
- No battle animations for sprites
- Fixed player character (knight)
- No AI variation between enemies

These are intentional simplifications for the MVP and can be enhanced later.
