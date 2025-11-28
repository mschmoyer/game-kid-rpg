/**
 * Simple Sprite Sheet Generator for Phaser 3
 * Uses Sharp for image manipulation
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const PNG_DIR = path.join(__dirname, '../sprites/png');
const OUTPUT_DIR = path.join(__dirname, '../sprites/sheets');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Define sprite sheet groups
const groups = [
    { name: 'monsters', dir: 'monsters' },
    { name: 'heroes', dir: 'heroes' },
    { name: 'gear', dir: 'gear' },
    { name: 'items', dir: 'items' },
    { name: 'npcs', dir: 'npcs' },
    { name: 'ui', dir: 'ui' },
    { name: 'effects', dir: 'effects' },
    { name: 'tiles-town', dir: 'tiles/town' },
    { name: 'tiles-dungeon', dir: 'tiles/dungeon' },
];

function nextPowerOfTwo(n) {
    let power = 1;
    while (power < n) power *= 2;
    return power;
}

async function getImageInfo(filePath) {
    const metadata = await sharp(filePath).metadata();
    return { width: metadata.width, height: metadata.height };
}

async function createSpriteSheet(group) {
    const inputDir = path.join(PNG_DIR, group.dir);

    if (!fs.existsSync(inputDir)) {
        console.log(`⚠ Skipping ${group.name}: directory not found`);
        return;
    }

    console.log(`📦 Creating ${group.name} sprite sheet...`);

    // Get all PNG files
    const files = fs.readdirSync(inputDir).filter(f => f.endsWith('.png'));

    if (files.length === 0) {
        console.log(`⚠ Skipping ${group.name}: no images found`);
        return;
    }

    // Load all images and get their dimensions
    const images = [];
    for (const file of files) {
        const filePath = path.join(inputDir, file);
        const info = await getImageInfo(filePath);
        images.push({
            name: file.replace('.png', ''),
            path: filePath,
            width: info.width,
            height: info.height
        });
    }

    // Sort by height (descending) for better packing
    images.sort((a, b) => b.height - a.height);

    // Simple row-based packing
    const padding = 2;
    let currentX = padding;
    let currentY = padding;
    let rowHeight = 0;
    let maxWidth = 0;

    const frames = {};
    const compositeOps = [];

    for (const img of images) {
        // Check if we need a new row
        if (currentX + img.width + padding > 1024) {
            currentX = padding;
            currentY += rowHeight + padding;
            rowHeight = 0;
        }

        frames[img.name] = {
            frame: { x: currentX, y: currentY, w: img.width, h: img.height },
            rotated: false,
            trimmed: false,
            spriteSourceSize: { x: 0, y: 0, w: img.width, h: img.height },
            sourceSize: { w: img.width, h: img.height }
        };

        compositeOps.push({
            input: img.path,
            left: currentX,
            top: currentY
        });

        currentX += img.width + padding;
        rowHeight = Math.max(rowHeight, img.height);
        maxWidth = Math.max(maxWidth, currentX);
    }

    const totalHeight = currentY + rowHeight + padding;

    // Round to power of two
    const sheetWidth = nextPowerOfTwo(maxWidth);
    const sheetHeight = nextPowerOfTwo(totalHeight);

    // Create the sprite sheet image
    const sheetImage = await sharp({
        create: {
            width: sheetWidth,
            height: sheetHeight,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 0 }
        }
    })
    .composite(compositeOps)
    .png()
    .toBuffer();

    // Write the sprite sheet image
    const pngPath = path.join(OUTPUT_DIR, `${group.name}.png`);
    fs.writeFileSync(pngPath, sheetImage);
    console.log(`   ✓ ${group.name}.png (${sheetWidth}x${sheetHeight})`);

    // Create Phaser 3 atlas JSON
    const atlas = {
        frames: frames,
        meta: {
            app: "slime-kingdom-packer",
            version: "1.0",
            image: `${group.name}.png`,
            format: "RGBA8888",
            size: { w: sheetWidth, h: sheetHeight },
            scale: 1
        }
    };

    const jsonPath = path.join(OUTPUT_DIR, `${group.name}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(atlas, null, 2));
    console.log(`   ✓ ${group.name}.json (${Object.keys(frames).length} frames)`);
}

async function main() {
    console.log('🎮 Generating Sprite Sheets for Slime Kingdom\n');

    for (const group of groups) {
        try {
            await createSpriteSheet(group);
        } catch (err) {
            console.error(`   ✗ Error: ${err.message}`);
        }
        console.log('');
    }

    console.log('✅ Sprite sheet generation complete!');
    console.log(`📁 Output: ${OUTPUT_DIR}`);
}

main().catch(console.error);
