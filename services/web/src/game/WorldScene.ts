import Phaser from "phaser";
import { getProgress, getWorld } from "../api/client";
import type { Point, World, Zone } from "../api/types";
import { bus } from "../events";
import { nearestWithin, TILE } from "./geometry";
import { lockedDoors } from "./locks";
import { buildMap, type MapData, zoneIndexAt } from "./mapgen";
import { MARKER_STYLE, markerFor } from "./markers";
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
const LOCK_HINT_MS = 1500;

interface MentorSprite {
  id: string;
  pos: Point;
  sprite: Phaser.GameObjects.Sprite;
  questId: string;
  marker: Phaser.GameObjects.Text;
}

/** The world: a tile map generated from /world, sprite characters, arrow keys and E. */
export class WorldScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private body!: Phaser.Physics.Arcade.Body;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private mentors: MentorSprite[] = [];
  private facing: Direction = "down";
  private hint!: Phaser.GameObjects.Text;
  private zones: Zone[] = [];
  private currentZone = -1;
  private banner?: Phaser.GameObjects.Container;
  private active = false; // true once the player has a name and no modal is open
  private doors: Point[] = [];
  private level = 1; // the player's level, refreshed with the markers
  private gates!: Phaser.Physics.Arcade.StaticGroup;
  private lockHint!: Phaser.GameObjects.Text;
  private lockHintUntil = 0;

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

    this.ui.onChange(() => {
      const wasActive = this.active;
      this.setActive(this.ui.active);
      // Player ready or a dialog closed: a quest may have been completed.
      if (this.active && !wasActive) void this.refreshMarkers();
    });

    try {
      this.drawWorld(await getWorld());
      if (this.active) void this.refreshMarkers();
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

    this.zones = world.zones;
    this.doors = map.doors;

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
      const marker = this.add
        .text(pos.x, pos.y - TILE * 1.6, MARKER_STYLE.quest.text, {
          fontSize: "20px",
          fontStyle: "bold",
          color: MARKER_STYLE.quest.color,
          stroke: "#000",
          strokeThickness: 4,
        })
        .setOrigin(0.5)
        .setDepth(2);
      this.tweens.add({
        targets: marker,
        y: marker.y - 4,
        duration: 500,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
      this.mentors.push({ id: m.id, pos, sprite, questId: m.quest_id, marker });
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
    this.gates = this.physics.add.staticGroup();
    this.physics.add.collider(this.player, this.gates, (_player, gate) => {
      this.showLockHint((gate as Phaser.GameObjects.GameObject).getData("zone") as Zone);
    });
    this.updateGates();
    this.physics.world.setBounds(0, 0, width, height);
    this.cameras.main.setBounds(0, 0, width, height).startFollow(this.player);

    this.hint = this.add
      .text(0, 0, "[E] Prata", { fontSize: "14px", color: "#fff", backgroundColor: "#000" })
      .setOrigin(0.5)
      .setVisible(false);
    this.lockHint = this.add
      .text(0, 0, "", {
        fontSize: "14px",
        color: "#fff",
        backgroundColor: "#000",
        padding: { x: 4, y: 2 },
      })
      .setOrigin(0.5, 1)
      .setDepth(3)
      .setVisible(false);
  }

  /** Closed gates on doors into zones above the player's level; fades out unlocked ones. */
  private updateGates(): void {
    const locked = lockedDoors(this.zones, this.doors, this.level);
    const key = (p: Point) => `${p.x},${p.y}`;
    const stillLocked = new Set(locked.map((d) => key(d.cell)));
    for (const gate of [...this.gates.getChildren()]) {
      if (stillLocked.has(gate.getData("cell"))) continue;
      this.gates.remove(gate);
      const targets = [gate, gate.getData("lock")];
      this.tweens.add({ targets, alpha: 0, duration: 600, onComplete: () => gate.destroy() });
    }
    const existing = new Set(this.gates.getChildren().map((g) => g.getData("cell")));
    for (const { cell, zone } of locked) {
      if (existing.has(key(cell))) continue;
      const x = (cell.x + 0.5) * TILE;
      const y = (cell.y + 0.5) * TILE;
      const gate = this.add.rectangle(x, y, TILE, TILE, 0x6b4a2b).setStrokeStyle(2, 0x2b1d10);
      gate.setData({ cell: key(cell), zone });
      const lock = this.add.text(x, y, "🔒", { fontSize: "16px" }).setOrigin(0.5).setDepth(1);
      gate.setData("lock", lock);
      gate.once("destroy", () => lock.destroy());
      this.gates.add(gate);
    }
  }

  private showLockHint(zone: Zone): void {
    this.lockHint
      .setText(`🔒 ${zone.name} öppnas på nivå ${zone.required_level}`)
      .setPosition(this.player.x, this.player.y - TILE * 0.8)
      .setVisible(true);
    this.lockHintUntil = this.time.now + LOCK_HINT_MS;
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

  /** Updates "!" / "✓" and the gates from the player's progress; keeps them on errors. */
  private async refreshMarkers(): Promise<void> {
    if (!this.ui.playerId || this.mentors.length === 0) return;
    try {
      const { completed_quests, level } = await getProgress(this.ui.playerId);
      for (const m of this.mentors) {
        const style = MARKER_STYLE[markerFor(m.questId, completed_quests)];
        m.marker.setText(style.text).setColor(style.color);
      }
      if (level !== this.level) {
        this.level = level;
        this.updateGates();
      }
    } catch (err) {
      console.warn("Could not refresh mentor markers", err);
    }
  }

  /** Shows the zone's name and topic when the player walks into a new zone. */
  private checkZone(): void {
    const zone = zoneIndexAt(
      this.zones,
      Math.floor(this.player.x / TILE),
      Math.floor(this.player.y / TILE),
    );
    if (zone < 0 || zone === this.currentZone) return;
    this.currentZone = zone;
    this.showBanner(this.zones[zone]);
  }

  private showBanner(zone: Zone): void {
    this.banner?.destroy();
    const { width, height } = this.scale;
    const style = { color: "#fff", stroke: "#000", fontFamily: "serif" };
    const title = this.add
      .text(0, 0, `~ ${zone.name} ~`, { ...style, fontSize: "40px", strokeThickness: 6 })
      .setOrigin(0.5, 1);
    const topic = this.add
      .text(0, 8, zone.topic, { ...style, fontSize: "20px", strokeThickness: 4 })
      .setOrigin(0.5, 0);
    const banner = this.add
      .container(width / 2, height / 3, [title, topic])
      .setScrollFactor(0)
      .setDepth(10)
      .setAlpha(0);
    this.banner = banner;
    this.tweens.chain({
      targets: banner,
      tweens: [
        { alpha: 1, duration: 300 },
        { alpha: 0, duration: 500, delay: 1500 },
      ],
      onComplete: () => banner.destroy(),
    });
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
    if (this.lockHint.visible && this.time.now > this.lockHintUntil)
      this.lockHint.setVisible(false);

    this.faceMentorsTowardsPlayer();
    if (!this.active) return;
    this.checkZone();
    const { left, right, up, down } = this.cursors;
    const vx = (right.isDown ? 1 : 0) - (left.isDown ? 1 : 0);
    const vy = (down.isDown ? 1 : 0) - (up.isDown ? 1 : 0);
    this.body.setVelocity(vx * SPEED, vy * SPEED);
    this.animatePlayer(vx, vy, this.isMovingFreely(vx, vy));
  }
}
