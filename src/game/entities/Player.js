import Phaser from 'phaser';
import { TILE_SIZE } from '../config.js';

const SPEED = 50;

/**
 * Player entity — animated character sprite.
 *
 * Sprite sheets: 64×64 frames, horizontal strip.
 * Walk → 6 frames   |   Idle → 4 frames.
 * "Side" faces right by default; flipX for left.
 *
 * The sprite origin is at bottom-centre (0.5, 1) so the
 * character's feet sit on the tile grid.  The physics body
 * is 16×16 to match one tile.
 */
export class Player {
    /**
     * @param {Phaser.Scene} scene
     * @param {number} x  - tile column
     * @param {number} y  - tile row
     */
    constructor(scene, x, y) {
        this.scene = scene;
        this.direction = 'down';
        this.isMoving = false;
        this.currentAnim = null;

        // World position = tile centre for X, tile bottom for Y
        const worldX = x * TILE_SIZE + TILE_SIZE / 2;
        const worldY = (y + 1) * TILE_SIZE; // bottom of the tile

        // ── Sprite (origin at feet) ──
        this.sprite = scene.physics.add.sprite(worldX, worldY, 'idle_down');
        this.sprite.setOrigin(0.5, 1);
        this.sprite.setDepth(10);

        // ── Physics body: 16×16, centred at the sprite's feet ──
        const body = this.sprite.body;
        body.setSize(TILE_SIZE, TILE_SIZE);
        body.setOffset(24, 48); // (64-16)/2 = 24 horizontal, 64-16 = 48 vertical
        body.setCollideWorldBounds(true);

        // ── Start idle facing down ──
        this.sprite.play('idle_down', true);

        // ── Input ──
        this.cursors = scene.input.keyboard.createCursorKeys();
        this.wasd = scene.input.keyboard.addKeys({
            up:    Phaser.Input.Keyboard.KeyCodes.W,
            down:  Phaser.Input.Keyboard.KeyCodes.S,
            left:  Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
        });
    }

    /* ───────────────────────────────────────────
     *  Update — call every frame from the scene
     * ─────────────────────────────────────────── */
    update() {
        const body = this.sprite.body;
        let vx = 0;
        let vy = 0;

        // ── Gather input ──
        if (this.cursors.left.isDown  || this.wasd.left.isDown)  { vx = -SPEED; }
        if (this.cursors.right.isDown || this.wasd.right.isDown) { vx =  SPEED; }
        if (this.cursors.up.isDown    || this.wasd.up.isDown)    { vy = -SPEED; }
        if (this.cursors.down.isDown  || this.wasd.down.isDown)  { vy =  SPEED; }

        // Normalise diagonal movement
        if (vx !== 0 && vy !== 0) {
            vx *= Math.SQRT1_2;
            vy *= Math.SQRT1_2;
        }

        body.setVelocity(vx, vy);

        // ── Determine facing direction ──
        if (vx < 0)       this.direction = 'left';
        else if (vx > 0)  this.direction = 'right';
        else if (vy < 0)  this.direction = 'up';
        else if (vy > 0)  this.direction = 'down';

        // ── Play the right animation ──
        const moving = vx !== 0 || vy !== 0;
        this._updateAnimation(moving);

        // ── Depth sort (lower Y → rendered behind) ──
        this.sprite.setDepth(this.sprite.y);
    }

    /* ───────────────────────────────────────────
     *  Animation state machine
     * ─────────────────────────────────────────── */
    _updateAnimation(moving) {
        let animKey;

        if (moving) {
            // Vertical movement (up/down) has its own sheets.
            // Horizontal movement uses the "side" sheet; flip for left.
            if (this.direction === 'up')        animKey = 'walk_up';
            else if (this.direction === 'down')  animKey = 'walk_down';
            else                                 animKey = 'walk_side';
        } else {
            if (this.direction === 'up')        animKey = 'idle_up';
            else if (this.direction === 'down')  animKey = 'idle_down';
            else                                 animKey = 'idle_side';
        }

        // Flip horizontally when facing left (side sheet faces right)
        this.sprite.setFlipX(this.direction === 'left');

        // Only restart the anim if it changed
        if (this.currentAnim !== animKey) {
            this.currentAnim = animKey;
            this.sprite.play(animKey, true); // true = ignore if already playing
        }
    }

    /** World position of the sprite's feet — useful for camera / dialog triggers. */
    getPosition() {
        return { x: this.sprite.x, y: this.sprite.y };
    }

    destroy() {
        this.sprite.destroy();
    }
}
