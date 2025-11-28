const { packAsync } = require('free-tex-packer-core');
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

async function loadImagesFromDir(dirPath) {
    const images = [];
    const files = fs.readdirSync(dirPath);

    for (const file of files) {
        if (file.endsWith('.png')) {
            const filePath = path.join(dirPath, file);
            const contents = fs.readFileSync(filePath);
            const name = file.replace('.png', '');
            images.push({
                path: name,
                name: name,
                contents: contents
            });
        }
    }
    return images;
}

async function createSpriteSheet(group) {
    const inputDir = path.join(PNG_DIR, group.dir);

    if (!fs.existsSync(inputDir)) {
        console.log(`⚠ Skipping ${group.name}: directory not found`);
        return;
    }

    console.log(`📦 Creating ${group.name} sprite sheet...`);

    const images = await loadImagesFromDir(inputDir);

    if (images.length === 0) {
        console.log(`⚠ Skipping ${group.name}: no images found`);
        return;
    }

    try {
        const files = await packAsync(images, {
            textureName: group.name,
            width: 1024,
            height: 1024,
            fixedSize: false,
            powerOfTwo: true,
            padding: 2,
            allowRotation: false,
            detectIdentical: true,
            allowTrim: false,
            exporter: "Phaser3",
            removeFileExtension: true,
            prependFolderName: false
        });

        for (const file of files) {
            const outputPath = path.join(OUTPUT_DIR, file.name);
            fs.writeFileSync(outputPath, file.buffer);
            console.log(`   ✓ ${file.name}`);
        }
    } catch (err) {
        console.error(`   ✗ Error creating ${group.name}:`, err.message);
    }
}

async function main() {
    console.log('🎮 Generating Sprite Sheets for Slime Kingdom\n');

    for (const group of groups) {
        await createSpriteSheet(group);
        console.log('');
    }

    console.log('✅ Sprite sheet generation complete!');
    console.log(`📁 Output: ${OUTPUT_DIR}`);
}

main().catch(console.error);
