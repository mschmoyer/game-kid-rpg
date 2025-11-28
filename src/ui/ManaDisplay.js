/**
 * Shared mana display component for showing player MP
 * Each star represents 4 MP with 4 quadrants (bottom-left, bottom-right, top-left, top-right)
 * Number of stars scales based on max MP
 * Uses the blue 'icon-star' sprite
 */
export default class ManaDisplay {
    /**
     * Creates a mana display
     * @param {Phaser.Scene} scene - The Phaser scene
     * @param {number} x - Starting X position
     * @param {number} y - Y position
     * @param {number} spacing - Space between stars (default 20)
     * @param {number} scale - Scale of star sprites (default 0.9)
     */
    constructor(scene, x, y, spacing = 20, scale = 0.9) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.spacing = spacing;
        this.scale = scale;
        this.starGroups = []; // Array of star groups, each with 4 quadrant sprites
        this.depth = 0;
    }

    /**
     * Updates the mana display based on current and max MP
     * Each star = 4 MP, each quadrant = 1 MP
     * Fill order: bottom-left, bottom-right, top-left, top-right
     * @param {number} currentMP - Current mana points
     * @param {number} maxMP - Maximum mana points
     */
    update(currentMP, maxMP) {
        // Clean up existing stars
        this.clearStars();

        // Calculate number of stars needed (4 MP per star, round up)
        const numStars = Math.ceil(maxMP / 4);

        // Get star frame dimensions (fallback to 24x24)
        let w = 24, h = 24;
        try {
            const frame = this.scene.textures.getFrame('ui', 'icon-star');
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
        // Order: bottom-left (1MP), bottom-right (2MP), top-left (3MP), top-right (4MP)
        const cropRegions = [
            [0, halfH, halfW, halfH],      // bottom-left
            [halfW, halfH, halfW, halfH],  // bottom-right
            [0, 0, halfW, halfH],          // top-left
            [halfW, 0, halfW, halfH],      // top-right
        ];

        for (let i = 0; i < numStars; i++) {
            const starX = this.x + (i * this.spacing);

            // Calculate MP for this specific star (0-4)
            const starStartMP = i * 4;
            const mpInThisStar = Math.max(0, Math.min(4, currentMP - starStartMP));

            const quadrants = [];

            // Create 4 quadrant sprites for this star
            for (let q = 0; q < 4; q++) {
                const sprite = this.scene.add.sprite(starX, this.y, 'ui', 'icon-star');
                sprite.setScale(this.scale);
                sprite.setCrop(cropRegions[q][0], cropRegions[q][1], cropRegions[q][2], cropRegions[q][3]);
                sprite.setDepth(this.depth);

                if (q < mpInThisStar) {
                    // This quadrant is filled - bright blue
                    sprite.setAlpha(1);
                    sprite.clearTint();
                } else {
                    // This quadrant is empty - faded
                    sprite.setAlpha(0.2);
                    sprite.setTint(0x444444);
                }

                quadrants.push(sprite);
            }

            this.starGroups.push(quadrants);
        }
    }

    /**
     * Clears all star sprites without destroying the component
     */
    clearStars() {
        this.starGroups.forEach(group => {
            group.forEach(sprite => sprite.destroy());
        });
        this.starGroups = [];
    }

    /**
     * Sets the depth of all stars (for layering)
     * @param {number} depth - The depth value
     */
    setDepth(depth) {
        this.depth = depth;
        this.starGroups.forEach(group => {
            group.forEach(sprite => sprite.setDepth(depth));
        });
    }

    /**
     * Destroys all star sprites
     */
    destroy() {
        this.clearStars();
    }
}
