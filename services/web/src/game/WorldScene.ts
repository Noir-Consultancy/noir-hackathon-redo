import Phaser from "phaser";
import { getWorld } from "../api/client";
import type { Point, World } from "../api/types";
import { bus } from "../events";
import { nearestWithin, TILE } from "./geometry";
import { buildMap, type MapData } from "./mapgen";
import {
  CHARACTERS_KEY,
  CHARACTERS_URL,
  DIRECTIONS,
  type Direction,
  directionFor,
  mentorFrame,
  PLAYER_KEY,
  PLAYER_URL,
  playerFrames,
  SPRITE_TILE,
} from "./sprites";
import { EMPTY, TILESET_KEY, TILESET_TILE, TILESET_URL } from "./tiles";
import type { UiState } from "./uiState";

const SPEED = 180;
const TALK_RANGE = TILE * 1.8;
const SCALE = TILE / SPRITE_TILE;
const FACE_RANGE = TILE * 4; // mentors turn towards the player within this distance

interface MentorSprite {
  id: string;
  pos: Point;
  sprite: Phaser.GameObjects.Sprite;
}

/** The world: a tile map generated from /world, sprite characters, arrow keys and E. */
export class WorldScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private body!: Phaser.Physics.Arcade.Body;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private mentors: MentorSprite[] = [];
  private facing: Direction = "down";
  private hint!: Phaser.GameObjects.Text;
  private active = false; // true once the player has a name and no modal is open

  constructor(private readonly ui: UiState) {
    super("world");
  }

  preload(): void {
    this.load.image(TILESET_KEY, TILESET_URL);
    const frame = { frameWidth: SPRITE_TILE, frameHeight: SPRITE_TILE };
    this.load.spritesheet(PLAYER_KEY, PLAYER_URL, frame);
    this.load.spritesheet(CHARACTERS_KEY, CHARACTERS_URL, frame);
  }

  async create(): Promise<void> {
    const keyboard = this.input.keyboard as Phaser.Input.Keyboard.KeyboardPlugin;
    this.cursors = keyboard.createCursorKeys();
    keyboard.on("keydown-E", () => this.interact());

    this.ui.onChange(() => this.setActive(this.ui.active));

    try {
      this.drawWorld(await getWorld());
    } catch (err) {
      console.error("Could not load the world", err);
      const { width, height } = this.scale;
      this.add
        .text(width / 2, height / 2, "Kunde inte ladda världen.\nKör api:t och ladda om sidan.", {
          fontSize: "20px",
          color: "#fff",
          align: "center",
        })
        .setOrigin(0.5)
        .setScrollFactor(0);
    }
  }

  private setActive(active: boolean): void {
    this.active = active;
    // Let the UI's text inputs receive keys while a modal is open.
    const keyboard = this.input.keyboard as Phaser.Input.Keyboard.KeyboardPlugin;
    keyboard.enabled = active;
    if (active) keyboard.addCapture("UP,DOWN,LEFT,RIGHT,SPACE");
    else keyboard.clearCaptures();
    if (!active && this.body) {
      this.body.setVelocity(0, 0);
      this.animatePlayer(0, 0);
    }
  }

  private drawWorld(world: World): void {
    const map = buildMap(world.zones, world.mentors);
    const walls = this.drawTiles(map);
    const width = map.width * TILE;
    const height = map.height * TILE;

    for (const zone of world.zones) {
      const { x, y } = zone.bounds;
      this.add
        .text((x + 1) * TILE + 4, (y + 1) * TILE + 4, zone.name, {
          fontSize: "18px",
          color: "#fff",
          stroke: "#000",
          strokeThickness: 4,
        })
        .setDepth(2);
    }

    const mentorBodies = this.physics.add.staticGroup();
    for (const m of world.mentors) {
      const pos = { x: (m.position.x + 0.5) * TILE, y: (m.position.y + 0.5) * TILE };
      const sprite = this.add.sprite(pos.x, pos.y, CHARACTERS_KEY, mentorFrame(m.id));
      sprite.setScale(SCALE);
      mentorBodies.add(sprite);
      // Breathe: a slow 1 px bob, offset per mentor so they don't move in sync.
      this.tweens.add({
        targets: sprite,
        y: pos.y - 1,
        duration: 900,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
        delay: this.mentors.length * 300,
      });
      this.add
        .text(pos.x, pos.y - TILE, m.name, {
          fontSize: "14px",
          color: "#fff",
          stroke: "#000",
          strokeThickness: 3,
        })
        .setOrigin(0.5)
        .setDepth(2);
      this.mentors.push({ id: m.id, pos, sprite });
    }

    const spawn = { x: (map.spawn.x + 0.5) * TILE, y: (map.spawn.y + 0.5) * TILE };
    this.createPlayerAnimations();
    this.player = this.physics.add.sprite(spawn.x, spawn.y, PLAYER_KEY, playerFrames("down").idle);
    this.player.setScale(SCALE).setDepth(1);
    this.body = this.player.body as Phaser.Physics.Arcade.Body;
    // A smaller body at the feet (in source pixels) slides through doors smoothly.
    this.body.setSize(10, 8).setOffset(3, 7);
    this.body.setCollideWorldBounds(true);
    this.physics.add.collider(this.player, walls);
    this.physics.add.collider(this.player, mentorBodies);
    this.physics.world.setBounds(0, 0, width, height);
    this.cameras.main.setBounds(0, 0, width, height).startFollow(this.player);

    this.hint = this.add
      .text(0, 0, "[E] Prata", { fontSize: "14px", color: "#fff", backgroundColor: "#000" })
      .setOrigin(0.5)
      .setVisible(false);
  }

  private createPlayerAnimations(): void {
    for (const dir of DIRECTIONS) {
      if (this.anims.exists(`walk-${dir}`)) continue;
      this.anims.create({
        key: `walk-${dir}`,
        frames: this.anims.generateFrameNumbers(PLAYER_KEY, { frames: playerFrames(dir).walk }),
        frameRate: 8,
        repeat: -1,
      });
    }
  }

  /** False when every pressed direction is blocked by a wall or a mentor (last physics step). */
  private isMovingFreely(vx: number, vy: number): boolean {
    const { blocked: b, touching: t } = this.body;
    const freeX = (vx < 0 && !b.left && !t.left) || (vx > 0 && !b.right && !t.right);
    const freeY = (vy < 0 && !b.up && !t.up) || (vy > 0 && !b.down && !t.down);
    return freeX || freeY;
  }

  /** Walk animation while moving, the idle frame of the facing direction otherwise. */
  private animatePlayer(vx: number, vy: number, moving = vx !== 0 || vy !== 0): void {
    this.facing = directionFor(vx, vy, this.facing);
    if (moving) this.player.anims.play(`walk-${this.facing}`, true);
    else {
      this.player.anims.stop();
      this.player.setFrame(playerFrames(this.facing).idle);
    }
  }

  /** Mentors close to the player turn to face them (characters face right by default). */
  private faceMentorsTowardsPlayer(): void {
    for (const m of this.mentors) {
      const dist = Phaser.Math.Distance.Between(m.pos.x, m.pos.y, this.player.x, this.player.y);
      if (dist < FACE_RANGE) m.sprite.setFlipX(this.player.x < m.pos.x);
    }
  }

  /** Ground and wall layers from 16 px tiles scaled up to TILE. Returns the wall layer. */
  private drawTiles(map: MapData): Phaser.Tilemaps.TilemapLayer {
    const tilemap = this.make.tilemap({
      tileWidth: TILESET_TILE,
      tileHeight: TILESET_TILE,
      width: map.width,
      height: map.height,
    });
    const tileset = tilemap.addTilesetImage(TILESET_KEY) as Phaser.Tilemaps.Tileset;
    const layer = (name: string, data: number[][]) => {
      const l = tilemap.createBlankLayer(name, tileset) as Phaser.Tilemaps.TilemapLayer;
      data.forEach((row, y) => {
        row.forEach((tile, x) => {
          if (tile !== EMPTY) l.putTileAt(tile, x, y);
        });
      });
      return l.setScale(TILE / TILESET_TILE);
    };
    layer("ground", map.ground);
    return layer("walls", map.walls).setCollisionByExclusion([EMPTY]);
  }

  private nearbyMentor() {
    if (!this.player) return undefined;
    return nearestWithin({ x: this.player.x, y: this.player.y }, this.mentors, TALK_RANGE);
  }

  private interact(): void {
    const mentor = this.active && this.nearbyMentor();
    if (mentor) bus.emit("npc:interact", { npcId: mentor.id });
  }

  update(): void {
    if (!this.body) return;
    const mentor = this.nearbyMentor();
    this.hint.setVisible(this.active && !!mentor);
    if (mentor) this.hint.setPosition(mentor.pos.x, mentor.pos.y + TILE);

    this.faceMentorsTowardsPlayer();
    if (!this.active) return;
    const { left, right, up, down } = this.cursors;
    const vx = (right.isDown ? 1 : 0) - (left.isDown ? 1 : 0);
    const vy = (down.isDown ? 1 : 0) - (up.isDown ? 1 : 0);
    this.body.setVelocity(vx * SPEED, vy * SPEED);
    this.animatePlayer(vx, vy, this.isMovingFreely(vx, vy));
  }
}
