/**
 * Shared heart display component for showing player HP
 * Each heart represents 4 HP with 4 quadrants (bottom-left, bottom-right, top-left, top-right)
 * Number of hearts scales based on max HP
 */
export default class HeartDisplay {
    /**
     * Creates a heart display
     * @param {Phaser.Scene} scene - The Phaser scene
     * @param {number} x - Starting X position
     * @param {number} y - Y position
     * @param {number} spacing - Space between hearts (default 20)
     * @param {number} scale - Scale of heart sprites (default 0.9)
     */
    constructor(scene, x, y, spacing = 20, scale = 0.9) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.spacing = spacing;
        this.scale = scale;
        this.heartGroups = []; // Array of heart groups, each with 4 quadrant sprites
        this.depth = 0;
    }

    /**
     * Updates the heart display based on current and max HP
     * Each heart = 4 HP, each quadrant = 1 HP
     * Fill order: bottom-left, bottom-right, top-left, top-right
     * @param {number} currentHP - Current health points
     * @param {number} maxHP - Maximum health points
     */
    update(currentHP, maxHP) {
        // Clean up existing hearts
        this.clearHearts();

        // Calculate number of hearts needed (4 HP per heart, round up)
        const numHearts = Math.ceil(maxHP / 4);

        // Get heart frame dimensions (fallback to 16x16)
        let w = 16, h = 16;
        try {
            const frame = this.scene.textures.getFrame('ui', 'icon-heart');
            if (frame) {
                w = frame.width;
                h = frame.height;
            }
        } catch (e) {
            // Use defaults
        }

        const halfW = Math.floor(w / 2);
        const halfH = Math.floor(h / 2);

        // Crop regions for each quadrant: [x, y, width, height]
        // Order: bottom-left (1HP), bottom-right (2HP), top-left (3HP), top-right (4HP)
        const cropRegions = [
            [0, halfH, halfW, halfH],      // bottom-left
            [halfW, halfH, halfW, halfH],  // bottom-right
            [0, 0, halfW, halfH],          // top-left
            [halfW, 0, halfW, halfH],      // top-right
        ];

        for (let i = 0; i < numHearts; i++) {
            const heartX = this.x + (i * this.spacing);

            // Calculate HP for this specific heart (0-4)
            const heartStartHP = i * 4;
            const hpInThisHeart = Math.max(0, Math.min(4, currentHP - heartStartHP));

            const quadrants = [];

            // Create 4 quadrant sprites for this heart
            for (let q = 0; q < 4; q++) {
                const sprite = this.scene.add.sprite(heartX, this.y, 'ui', 'icon-heart');
                sprite.setScale(this.scale);
                sprite.setCrop(cropRegions[q][0], cropRegions[q][1], cropRegions[q][2], cropRegions[q][3]);
                sprite.setDepth(this.depth);

                if (q < hpInThisHeart) {
                    // This quadrant is filled - bright
                    sprite.setAlpha(1);
                    sprite.clearTint();
                } else {
                    // This quadrant is empty - faded
                    sprite.setAlpha(0.2);
                    sprite.setTint(0x444444);
                }

                quadrants.push(sprite);
            }

            this.heartGroups.push(quadrants);
        }
    }

    /**
     * Clears all heart sprites without destroying the component
     */
    clearHearts() {
        this.heartGroups.forEach(group => {
            group.forEach(sprite => sprite.destroy());
        });
        this.heartGroups = [];
    }

    /**
     * Sets the depth of all hearts (for layering)
     * @param {number} depth - The depth value
     */
    setDepth(depth) {
        this.depth = depth;
        this.heartGroups.forEach(group => {
            group.forEach(sprite => sprite.setDepth(depth));
        });
    }

    /**
     * Destroys all heart sprites
     */
    destroy() {
        this.clearHearts();
    }
}
