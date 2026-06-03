import { TILE_SIZE } from '../config.js';

/**
 * NPC entity — stationary character with proximity interaction.
 *
 * Uses a placeholder rectangle as sprite until proper art is added.
 * Emits events on `scene.events` when the player enters/leaves range.
 */
export class NPC {
    /**
     * @param {Phaser.Scene} scene
     * @param {number} x          - tile column
     * @param {number} y          - tile row
     * @param {object} opts
     * @param {string} opts.name       - display name
     * @param {string} opts.dialogText - text shown when interacted
     * @param {number} opts.color      - hex colour for placeholder
     * @param {number} opts.radius     - interaction radius in px (default 48)
     */
    constructor(scene, x, y, opts) {
        this.scene = scene;
        this.name = opts.name;
        this.dialogText = opts.dialogText;
        this.interactRadius = opts.radius ?? 48;
        this.isNear = false;

        const worldX = x * TILE_SIZE + TILE_SIZE / 2;
        const worldY = (y + 1) * TILE_SIZE;

        // ── Placeholder rectangle (16×24) ──
        this.sprite = scene.add.rectangle(worldX, worldY - 12, 16, 24, opts.color ?? 0x8b4513);
        this.sprite.setOrigin(0.5, 1);
        this.sprite.setDepth(9);

        // ── Physics body ──
        scene.physics.add.existing(this.sprite, true); // static body
    }

    /**
     * Call every frame from the scene.
     * @param {{ x: number, y: number }} playerPos - player world position
     */
    update(playerPos) {
        const dx = playerPos.x - this.sprite.x;
        const dy = playerPos.y - this.sprite.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const withinRange = dist < this.interactRadius;

        if (withinRange && !this.isNear) {
            this.isNear = true;
            this.scene.events.emit('npc-near', {
                name: this.name,
                dialogText: this.dialogText,
            });
        } else if (!withinRange && this.isNear) {
            this.isNear = false;
            this.scene.events.emit('npc-far', { name: this.name });
        }
    }

    destroy() {
        this.sprite.destroy();
    }
}
