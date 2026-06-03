import Phaser from 'phaser';
import { Player } from '../entities/Player.js';
import { TILE_SIZE } from '../config.js';

const MAP_COLS = 25;
const MAP_ROWS = 18;

const BASE = '/assets/tilesets/anakolisa/Pixel Crawler - Free Pack/Entities/Characters/Body_A/Animations';

/**
 * WhisperingPath — the entrance path leading into the village.
 *
 * Uses the Serene Village 16×16 tileset for the ground and
 * Pixel Crawler character sprites for the player.
 */
export class WhisperingPath extends Phaser.Scene {
    constructor() {
        super('WhisperingPath');
    }

    /* ───────────────────────────────────────────
     *  Preload
     * ─────────────────────────────────────────── */
    preload() {
        // ── Tileset ──
        this.load.image('village_tiles', '/assets/tilesets/limezu/SERENE_VILLAGE_REVAMPED/Serene_Village_16x16.png');

        // ── Character walk sheets (6 frames each, 64×64) ──
        this.load.spritesheet('walk_down', `${BASE}/Walk_Base/Walk_Down-Sheet.png`, { frameWidth: 64, frameHeight: 64 });
        this.load.spritesheet('walk_side', `${BASE}/Walk_Base/Walk_Side-Sheet.png`, { frameWidth: 64, frameHeight: 64 });
        this.load.spritesheet('walk_up',   `${BASE}/Walk_Base/Walk_Up-Sheet.png`,   { frameWidth: 64, frameHeight: 64 });

        // ── Character idle sheets (4 frames each, 64×64) ──
        this.load.spritesheet('idle_down', `${BASE}/Idle_Base/Idle_Down-Sheet.png`, { frameWidth: 64, frameHeight: 64 });
        this.load.spritesheet('idle_side', `${BASE}/Idle_Base/Idle_Side-Sheet.png`, { frameWidth: 64, frameHeight: 64 });
        this.load.spritesheet('idle_up',   `${BASE}/Idle_Base/Idle_Up-Sheet.png`,   { frameWidth: 64, frameHeight: 64 });
    }

    /* ───────────────────────────────────────────
     *  Create
     * ─────────────────────────────────────────── */
    create() {
        this._createAnimations();
        this._buildTilemap();

        // ── Player ──
        this.player = new Player(this, 12, 14);

        // ── World bounds ──
        this.physics.world.setBounds(0, 0, MAP_COLS * TILE_SIZE, MAP_ROWS * TILE_SIZE);

        // ── Camera ──
        this.cameras.main.setBounds(0, 0, MAP_COLS * TILE_SIZE, MAP_ROWS * TILE_SIZE);
        this.cameras.main.startFollow(this.player.sprite, true, 0.12, 0.12);

        // ── Colliders for tree tiles ──
        this._setupTreeColliders();
    }

    /* ───────────────────────────────────────────
     *  Update
     * ─────────────────────────────────────────── */
    update() {
        this.player.update();
    }

    /* ───────────────────────────────────────────
     *  Animation definitions
     * ─────────────────────────────────────────── */
    _createAnimations() {
        const frameRate = 8;

        // Walk (6 frames: 0-5)
        this.anims.create({ key: 'walk_down', frames: this.anims.generateFrameNumbers('walk_down', { start: 0, end: 5 }), frameRate, repeat: -1 });
        this.anims.create({ key: 'walk_side', frames: this.anims.generateFrameNumbers('walk_side', { start: 0, end: 5 }), frameRate, repeat: -1 });
        this.anims.create({ key: 'walk_up',   frames: this.anims.generateFrameNumbers('walk_up',   { start: 0, end: 5 }), frameRate, repeat: -1 });

        // Idle (4 frames: 0-3)
        this.anims.create({ key: 'idle_down', frames: this.anims.generateFrameNumbers('idle_down', { start: 0, end: 3 }), frameRate: 4, repeat: -1 });
        this.anims.create({ key: 'idle_side', frames: this.anims.generateFrameNumbers('idle_side', { start: 0, end: 3 }), frameRate: 4, repeat: -1 });
        this.anims.create({ key: 'idle_up',   frames: this.anims.generateFrameNumbers('idle_up',   { start: 0, end: 3 }), frameRate: 4, repeat: -1 });
    }

    /* ───────────────────────────────────────────
     *  Tilemap — procedural from Serene Village
     * ───────────────────────────────────────────
     *
     *  Tileset: 304×720 → 19 cols × 45 rows.
     *  Index = row * 19 + col   (0-based).
     *
     *  Indices verified via Mimo API (mimo-v2.5).
     */
    _buildTilemap() {
        // ── Tile index constants (pixel-by-pixel verified) ──
        const T = {
            GRASS: 22,  // row 1, col 3 — hijau solid
            DIRT:  64,  // row 3, col 7 — coklat tanah
            WATER: 20,  // row 1, col 1 — biru air
            TREE: 123,
            ROCK:  57,
            BUSH:  41,
        };

        // ── Tile index map (row-major, 25×18) ──
        // G = GRASS, W = WATER, D = DIRT, Tt = TREE, R = ROCK, B = BUSH
        const G = T.GRASS, W = T.WATER, D = T.DIRT,
              Tt = T.TREE, R = T.ROCK, B = T.BUSH;
        // prettier-ignore
        const MAP = [
        //  0    1    2    3    4    5    6    7    8    9   10   11   12   13   14   15   16   17   18   19   20   21   22   23   24
            [ W,  W,  G, Tt,  G,  G,  G,  G,  G,  G,  G,  D,  D,  D,  G, Tt,  G,  G,  G,  G,  G,  G,  G,  G,  G],  // 0
            [ W,  W,  G, Tt,  G,  G,  G,  G,  G,  G,  G,  D,  D,  D,  G, Tt,  G,  G,  G,  G,  G,  G,  G,  G,  G],  // 1
            [ W,  W,  G, Tt,  G,  G,  G,  G,  G,  G,  G,  D,  D,  D,  G, Tt,  G,  G,  G,  G,  G,  G,  G,  G,  G],  // 2
            [ W,  W,  G, Tt,  G,  G,  G,  G,  G,  G,  G,  D,  D,  D,  G, Tt,  G,  G,  G,  G,  G,  G,  G,  G,  G],  // 3
            [ W,  W,  G, Tt,  G,  G,  G,  G,  G,  G,  G,  D,  D,  D,  G, Tt,  G,  G,  G,  G,  G,  G,  G,  G,  G],  // 4
            [ W,  W,  G, Tt,  G,  G,  G,  G,  G,  G,  G,  D,  D,  D,  G, Tt,  G,  G,  G,  G,  G,  G,  G,  G,  G],  // 5
            [ W,  W,  G, Tt,  G,  G,  G,  G,  G,  G,  G,  D,  D,  D,  G, Tt,  G,  G,  G,  G,  G,  G,  G,  G,  G],  // 6
            [ W,  W,  G, Tt,  G,  G,  G,  G,  G,  G,  G,  D,  D,  D,  G, Tt,  G,  G,  G,  G,  G,  G,  G,  G,  G],  // 7
            [ W,  W,  G, Tt,  G,  G,  G,  G,  G,  G,  G,  D,  D,  D,  G, Tt,  G,  G,  G,  G,  G,  G,  G,  G,  G],  // 8
            [ W,  W,  G, Tt,  G,  G,  G,  G,  G,  G,  G,  D,  D,  D,  G, Tt,  G,  G,  G,  G,  G,  G,  G,  G,  G],  // 9
            [ W,  W,  G, Tt,  G,  G,  G,  G,  G,  G,  G,  D,  D,  D,  G, Tt,  G,  G,  G,  G,  G,  G,  G,  G,  G],  // 10
            [ W,  W,  G, Tt,  G,  G,  G,  G,  G,  G,  G,  D,  D,  D,  G, Tt,  G,  G,  G,  G,  G,  G,  G,  G,  G],  // 11
            [ G,  G,  G, Tt,  G,  G,  G,  G,  G,  G,  G,  D,  D,  D,  G, Tt,  G,  G,  G,  G,  G,  G,  G,  G,  G],  // 12
            [ G,  G,  G, Tt,  G,  G,  G,  G,  G,  G,  G,  D,  D,  D,  G, Tt,  G,  G,  G,  G,  G,  G,  G,  G,  G],  // 13
            [ G,  G,  G, Tt,  G,  G,  G,  G,  G,  G,  G,  D,  D,  D,  G, Tt,  G,  G,  G,  G,  G,  G,  G,  G,  G],  // 14
            [ G,  G,  G, Tt,  G,  G,  G,  G,  G,  G,  G,  D,  D,  D,  G, Tt,  G,  G,  G,  G,  G,  G,  G,  G,  G],  // 15
            [ G,  G,  G, Tt,  G,  G,  G,  G,  G,  G,  G,  D,  D,  D,  G, Tt,  G,  G,  G,  G,  G,  G,  G,  G,  G],  // 16
            [ G,  G,  G,  G,  G,  G,  G,  G,  G,  G,  G,  D,  D,  D,  G,  G,  G,  G,  G,  G,  G,  G,  G,  G,  G],  // 17
        ];

        // ── Build the tilemap ──
        const map = this.make.tilemap({
            tileWidth: TILE_SIZE,
            tileHeight: TILE_SIZE,
            width: MAP_COLS,
            height: MAP_ROWS,
        });

        const tileset = map.addTilesetImage('village_tiles', 'village_tiles', TILE_SIZE, TILE_SIZE);
        const layer = map.createBlankLayer('ground', tileset);

        for (let y = 0; y < MAP_ROWS; y++) {
            for (let x = 0; x < MAP_COLS; x++) {
                layer.putTileAt(MAP[y][x], x, y);
            }
        }

        this.groundLayer = layer;
        this.tileMap = map;
    }

    /* ───────────────────────────────────────────
     *  Tree colliders — mark TREE_TRUNK tiles as
     *  collidable so the player can't walk through them.
     * ─────────────────────────────────────────── */
    _setupTreeColliders() {
        const TREE_TRUNK = 123;

        this.groundLayer.setCollision(TREE_TRUNK);
        this.physics.add.collider(this.player.sprite, this.groundLayer);
    }
}
