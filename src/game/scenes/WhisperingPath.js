import Phaser from 'phaser';
import { Player } from '../entities/Player.js';
import { NPC } from '../entities/NPC.js';
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

        // ── Animated tileset sprites ──
        this.load.spritesheet('water_anim', '/assets/tilesets/limezu/SERENE_VILLAGE_REVAMPED/Animated stuff/water_waves_16x16.png', { frameWidth: 16, frameHeight: 16 });
        this.load.spritesheet('campfire_anim', '/assets/tilesets/limezu/SERENE_VILLAGE_REVAMPED/Animated stuff/campfire_16x16.png', { frameWidth: 16, frameHeight: 16 });

        // ── Tree sprite ──
        this.load.image('tree', '/assets/tree_sprite.png');
    }

    /* ───────────────────────────────────────────
     *  Create
     * ─────────────────────────────────────────── */
    create() {
        this._createAnimations();
        this._buildTilemap();
        this._spawnAnimatedTiles();

        // ── Player ──
        this.player = new Player(this, 12, 8);

        // ── NPC: Nenek Reike ──
        this.npc = new NPC(this, 12, 16, {
            name: 'Nenek Reike',
            dialogText: 'Hei anak muda... kamu terlihat lelah. Mau singgah dulu?',
            color: 0x8b4513,
            radius: 48,
        });

        // ── Interaction state ──
        this.dialogOpen = false;
        this.interactKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // ── Tree sprites ──
        const trees = this.physics.add.staticGroup();
        const treePositionsLeft = [80, 176, 272, 368, 464];
        const treePositionsRight = [128, 224, 320, 416];

        treePositionsLeft.forEach(y => {
            const t = trees.create(96, y, 'tree');
            t.setScale(1.5);
            t.body.setSize(20, 12);
            t.body.setOffset(6, 36);
        });
        treePositionsRight.forEach(y => {
            const t = trees.create(240, y, 'tree');
            t.setScale(1.5);
            t.body.setSize(20, 12);
            t.body.setOffset(6, 36);
        });

        this.physics.add.collider(this.player.sprite, trees);

        // ── World bounds ──
        this.physics.world.setBounds(0, 0, MAP_COLS * TILE_SIZE, MAP_ROWS * TILE_SIZE);
        this.physics.world.drawDebug = false;

        // ── Camera ──
        this.cameras.main.setBounds(0, 0, MAP_COLS * TILE_SIZE, MAP_ROWS * TILE_SIZE);
        this.cameras.main.startFollow(this.player.sprite, true, 0.12, 0.12);
    }

    /* ───────────────────────────────────────────
     *  Update
     * ─────────────────────────────────────────── */
    update() {
        this.player.update();

        // ── NPC proximity check ──
        const pos = this.player.getPosition();
        this.npc.update(pos);

        // ── Interaction input ──
        const eJustPressed = Phaser.Input.Keyboard.JustDown(this.interactKey);
        const spaceJustPressed = Phaser.Input.Keyboard.JustDown(this.spaceKey);

        if (this.dialogOpen) {
            // Close dialog with E or Space
            if (eJustPressed || spaceJustPressed) {
                this.dialogOpen = false;
                this.events.emit('dialog-close');
            }
        } else if (eJustPressed && this.npc.isNear) {
            // Open dialog
            this.dialogOpen = true;
            this.events.emit('dialog-open', {
                speaker: this.npc.name,
                text: this.npc.dialogText,
            });
        }
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

        // Animated tiles
        this.anims.create({ key: 'water_anim', frames: this.anims.generateFrameNumbers('water_anim', { start: 0, end: 13 }), frameRate: 8, repeat: -1 });
        this.anims.create({ key: 'campfire_anim', frames: this.anims.generateFrameNumbers('campfire_anim', { start: 0, end: 3 }), frameRate: 6, repeat: -1 });
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
            GRASS1:    36,  // hijau terang
            GRASS2:    17,  // hijau agak gelap
            GRASS_EDGE: 22, // tepi sungai
            DIRT:      48,  // solid coklat
            PATH_EDGE: 65,  // pinggiran jalan
            WATER:     31,  // biru solid cerah
            ROCK:      58,  // batu abu-abu
            BUSH:      40,  // semak hijau kecil
        };

        // ── Tile index map (row-major, 25×18) ──
        const G1 = T.GRASS1, G2 = T.GRASS2, Ge = T.GRASS_EDGE,
              W = T.WATER, D = T.DIRT, Pe = T.PATH_EDGE,
              R = T.ROCK, B = T.BUSH;
        // prettier-ignore
        const MAP = [
        //  0    1    2    3    4    5    6    7    8    9   10   11   12   13   14   15   16   17   18   19   20   21   22   23   24
            [G1,  W,  W, Ge, G2, G2, G2,  G1, G2, G2, Pe,  D,  D,  D, Pe, G2, G2, G1, G2, G1, G2, G1, G2, G1, G2],  // 0
            [G2,  W,  W, Ge, G2,  G1, G2,  G1,  G2, G1, Pe,  D,  D,  D, Pe,  G1, G2, G2, G1, G2, G1, G2, G1, G2, G1],  // 1
            [G1,  W,  W, Ge, G2, G2, G1,  G2,  G1, G2, Pe,  D,  D,  D, Pe, G2, G2, G1, G2, G1, G2, G1, G2, G1, G2],  // 2
            [G2,  W,  W, Ge, G2,  G2, G1,  G1,  G2, G1, Pe,  D,  D,  D, Pe,  G2, G2, G2, G1, G2, G1, G2, G1, G2, G1],  // 3
            [G1,  W,  W, Ge, G2, G2, G2,  G1, G2, G2, Pe,  D,  D,  D, Pe, G2, G2, G1, G2, G1, G2, G1, G2, G1, G2],  // 4
            [G2,  W,  W, Ge, G2,  G1, G2,  G1,  G2, G1, Pe,  D,  D,  D, Pe,  G1, G2, G2, G1, G2, G1, G2, G1, G2, G1],  // 5
            [G1,  W,  W, Ge, G2, G2, G1,  G2, G2, G2, Pe,  D,  D,  D, Pe, G2, G2, G1, G2, G1, G2, G1, G2, G1, G2],  // 6
            [G2,  W,  W, Ge, G2,  G2, G1,  G1,  G2, G1, Pe,  D,  D,  D, Pe,  G2, G2, G2, G1, G2, G1, G2, G1, G2, G1],  // 7
            [G1,  W,  W, Ge, G2, G2, G2,  G1, G2, G2, Pe,  D,  D,  D, Pe, G2, G2, G1, G2, G1, G2, G1, G2, G1, G2],  // 8
            [G2,  W,  W, Ge, G2,  G1, G2,  G1,  G2, G1, Pe,  D,  D,  D, Pe,  G1, G2, G2, G1, G2, G1, G2, G1, G2, G1],  // 9
            [G1,  W,  W, Ge, G2, G2, G1,  G2, G2, G2, Pe,  D,  D,  D, Pe, G2, G2, G1, G2, G1, G2, G1, G2, G1, G2],  // 10
            [G2,  W,  W, Ge, G2,  G2, G1,  G1,  G2, G1, Pe,  D,  D,  D, Pe,  G2, G2, G2, G1, G2, G1, G2, G1, G2, G1],  // 11
            [G1,  W,  W, Ge, G2, G2, G2,  G1, G2, G2, Pe,  D,  D,  D, Pe, G2, G2, G1, G2, G1, G2, G1, G2, G1, G2],  // 12
            [G2,  W,  W, Ge, G2,  G1, G2,  G1,  G2, G1, Pe,  D,  D,  D, Pe,  G1, G2, G2, G1, G2, G1, G2, G1, G2, G1],  // 13
            [G1,  W,  W, Ge, G2, G2, G1,  G2, G2, G2, Pe,  D,  D,  D, Pe, G2, G2, G1, G2, G1, G2, G1, G2, G1, G2],  // 14
            [G2,  W,  W, Ge, G2,  G2, G1,  G1,  G2, G1, Pe,  D,  D,  D, Pe,  G2, G2, G2, G1, G2, G1, G2, G1, G2, G1],  // 15
            [G1,  W,  W, Ge, G2, G2, G2,  G1, G2, G2, Pe,  D,  D,  D, Pe, G2, G2, G1, G2, G1, G2, G1, G2, G1, G2],  // 16
            [G2, G1, G2, G1, G2, G1, G2, G1, G2, G1, G2,  D,  D,  D, G1, G2, G1, G2, G1, G2, G1, G2, G1, G2, G1],  // 17
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
     *  Animated tiles — water waves + campfire
     * ─────────────────────────────────────────── */
    _spawnAnimatedTiles() {
        const WATER_COL_1 = 1;
        const WATER_COL_2 = 2;

        // ── Water waves on col 1-2, every row ──
        for (let row = 0; row < MAP_ROWS - 1; row++) { // skip row 17 (no water)
            for (const col of [WATER_COL_1, WATER_COL_2]) {
                const worldX = col * TILE_SIZE + TILE_SIZE / 2;
                const worldY = row * TILE_SIZE + TILE_SIZE / 2;
                const water = this.add.sprite(worldX, worldY, 'water_anim');
                water.play('water_anim');
                water.setDepth(row * TILE_SIZE + TILE_SIZE / 2); // depth sort by row
            }
        }

        // ── Campfire near Nenek Reike ──
        const fireX = 10 * TILE_SIZE + TILE_SIZE / 2;
        const fireY = 17 * TILE_SIZE + TILE_SIZE / 2;
        const campfire = this.add.sprite(fireX, fireY, 'campfire_anim');
        campfire.play('campfire_anim');
        campfire.setDepth(17 * TILE_SIZE + TILE_SIZE / 2);
    }

}
