/**
 * Updates specific tiles in existing sprite sheets
 * without regenerating everything
 */

const sharp = require('sharp');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, '../public');
const PNG_DIR = path.join(__dirname, '../sprites/png');

// Tile positions from the existing JSON files
const updates = [
    {
        sheet: 'tiles-town.png',
        tiles: [
            { name: 'grass', src: 'tiles/town/grass.png', x: 432, y: 2, w: 32, h: 32 }
        ]
    },
    {
        sheet: 'tiles-dungeon.png',
        tiles: [
            { name: 'floor-stone', src: 'tiles/dungeon/floor-stone.png', x: 138, y: 2, w: 32, h: 32 },
            { name: 'wall-stone', src: 'tiles/dungeon/wall-stone.png', x: 342, y: 2, w: 32, h: 32 }
        ]
    }
];

async function updateSheets() {
    console.log('🎨 Updating tile sprite sheets with new pixel art...\n');

    for (const update of updates) {
        const sheetPath = path.join(PUBLIC_DIR, update.sheet);
        console.log(`📦 Updating ${update.sheet}...`);

        try {
            // Read the existing sprite sheet
            let sheet = sharp(sheetPath);
            const metadata = await sheet.metadata();

            // Prepare composite operations
            const composites = [];

            for (const tile of update.tiles) {
                const tilePath = path.join(PNG_DIR, tile.src);
                console.log(`   Adding ${tile.name} at (${tile.x}, ${tile.y})`);

                composites.push({
                    input: tilePath,
                    left: tile.x,
                    top: tile.y
                });
            }

            // Apply all composites and save
            await sharp(sheetPath)
                .composite(composites)
                .toFile(sheetPath + '.tmp');

            // Replace original with updated version
            const fs = require('fs');
            fs.renameSync(sheetPath + '.tmp', sheetPath);

            console.log(`   ✓ ${update.sheet} updated\n`);
        } catch (err) {
            console.error(`   ✗ Error updating ${update.sheet}: ${err.message}\n`);
        }
    }

    console.log('✅ Tile updates complete!');
}

updateSheets().catch(console.error);
