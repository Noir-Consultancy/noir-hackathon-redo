import Phaser from "phaser";
import { getProgress, getRemark, getWorld } from "../api/client";
import type { Point, Rect, World, Zone } from "../api/types";
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
import { pickWanderPath } from "./wander";

const SPEED = 180;
const TALK_RANGE = TILE * 1.8;
const SCALE = TILE / SPRITE_TILE;
const FACE_RANGE = TILE * 4; // mentors stop and turn towards the player within this distance
const REMARK_RANGE = TILE * 3; // walking this close makes a mentor remark on something
const WANDER_SPEED = 40;
const REST_MS = [2000, 5000]; // pause between walks
const THINKING_DELAY = 300; // show "…" only if the remark takes longer than this
const LINGER_MS = 3000; // a remark stays this long after the player walks away
const HUD_HEIGHT = TILE * 2.5; // the HUD covers the top of the screen; bubbles stay below it
const BUBBLE_MARGIN = 8;
const LOCK_HINT_MS = 1500;

interface MentorSprite {
  id: string;
  pos: Point; // pixels, follows the body
  body: Phaser.Physics.Arcade.Body;
  figure: Phaser.GameObjects.Container; // the sprite, under the player
  labels: Phaser.GameObjects.Container; // name, marker and bubble, above the player
  sprite: Phaser.GameObjects.Sprite;
  questId: string;
  marker: Phaser.GameObjects.Text;
  bubble: Phaser.GameObjects.Text;
  bounds: Rect; // the mentor's zone, in tiles
  path: Point[]; // remaining waypoints, pixels
  restUntil: number; // scene time
  near: boolean; // player within REMARK_RANGE last frame
  remark: "idle" | "loading" | "showing";
  remarkId: number; // bumped to discard a pending remark
  hideAt: number; // scene time when a showing remark disappears
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
  private map!: MapData;
  private currentZone = -1;
  private banner?: Phaser.GameObjects.Container;
  private active = false; // true once the player has a name and no modal is open
  private doors: Point[] = [];
  private doorZones: [number, number][] = [];
  private level: number | null = null; // the player's level once progress has loaded
  private gates?: Phaser.Physics.Arcade.StaticGroup;
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
    keyboard.on("keydown-E", (e: KeyboardEvent) => {
      // The dialog focuses its input during this keydown; without this the "e" lands in it.
      e.preventDefault();
      this.interact();
    });

    this.ui.onChange(() => {
      const wasActive = this.active;
      this.setActive(this.ui.active);
      // Player ready or a dialog closed: a quest may have been completed.
      if (this.active && !wasActive) void this.refreshProgress();
    });

    try {
      this.drawWorld(await getWorld());
      if (this.active) void this.refreshProgress();
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
    this.map = map;
    this.doors = map.doors;
    this.doorZones = map.doorZones;

    const mentorBodies: Phaser.GameObjects.Zone[] = [];
    for (const m of world.mentors) {
      const pos = { x: (m.position.x + 0.5) * TILE, y: (m.position.y + 0.5) * TILE };
      // An invisible body walks and blocks the player; the view follows it.
      const hitbox = this.add.zone(pos.x, pos.y, TILE * 0.8, TILE * 0.8);
      this.physics.add.existing(hitbox);
      const body = (hitbox.body as Phaser.Physics.Arcade.Body).setImmovable(true);
      body.pushable = false;
      mentorBodies.push(hitbox);
      const sprite = this.add.sprite(0, 0, CHARACTERS_KEY, mentorFrame(m.id)).setScale(SCALE);
      // Breathe: a slow 1 px bob, offset per mentor so they don't move in sync.
      this.tweens.add({
        targets: sprite,
        y: -1,
        duration: 900,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
        delay: this.mentors.length * 300,
      });
      const name = this.add
        .text(0, -TILE, m.name, {
          fontSize: "14px",
          color: "#fff",
          stroke: "#000",
          strokeThickness: 3,
        })
        .setOrigin(0.5);
      const marker = this.add
        .text(0, -TILE * 1.6, MARKER_STYLE.quest.text, {
          fontSize: "20px",
          fontStyle: "bold",
          color: MARKER_STYLE.quest.color,
          stroke: "#000",
          strokeThickness: 4,
        })
        .setOrigin(0.5);
      this.tweens.add({
        targets: marker,
        y: marker.y - 4,
        duration: 500,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
      const bubble = this.add
        .text(0, -TILE * 2.1, "", {
          fontSize: "14px",
          color: "#000",
          backgroundColor: "#fff",
          padding: { x: 8, y: 6 },
          wordWrap: { width: TILE * 6 },
        })
        .setOrigin(0.5, 1)
        .setVisible(false);
      const figure = this.add.container(pos.x, pos.y, [sprite]);
      const labels = this.add.container(pos.x, pos.y, [name, marker, bubble]).setDepth(2);
      const zone = world.zones.find((z) => z.id === m.zone_id);
      this.mentors.push({
        id: m.id,
        pos,
        body,
        figure,
        labels,
        sprite,
        questId: m.quest_id,
        marker,
        bubble,
        bounds: zone?.bounds ?? { ...m.position, w: 1, h: 1 },
        path: [],
        restUntil: 0,
        near: false,
        remark: "idle",
        remarkId: 0,
        hideAt: 0,
      });
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
    const gates = this.physics.add.staticGroup();
    this.gates = gates;
    this.physics.add.collider(this.player, gates, (_player, gate) => {
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

  /**
   * Closed gates on doors into zones above the player's level; fades out unlocked ones.
   * Waits for both the map and the player's level, so a returning player never sees gates
   * for zones they have already unlocked.
   */
  private updateGates(): void {
    const gates = this.gates;
    if (!gates || this.level === null) return;
    const locked = lockedDoors(this.zones, this.doors, this.doorZones, this.level);
    const key = (p: Point) => `${p.x},${p.y}`;
    const stillLocked = new Set(locked.map((d) => key(d.cell)));
    for (const gate of [...gates.getChildren()]) {
      if (stillLocked.has(gate.getData("cell"))) continue;
      gates.remove(gate);
      const targets = [gate, gate.getData("lock")];
      this.tweens.add({ targets, alpha: 0, duration: 600, onComplete: () => gate.destroy() });
    }
    const existing = new Set(gates.getChildren().map((g) => g.getData("cell")));
    for (const { cell, zone } of locked) {
      if (existing.has(key(cell))) continue;
      const x = (cell.x + 0.5) * TILE;
      const y = (cell.y + 0.5) * TILE;
      const gate = this.add.rectangle(x, y, TILE, TILE, 0x6b4a2b).setStrokeStyle(2, 0x2b1d10);
      gate.setData({ cell: key(cell), zone });
      const lock = this.add.text(x, y, "🔒", { fontSize: "16px" }).setOrigin(0.5).setDepth(1);
      gate.setData("lock", lock);
      gate.once("destroy", () => lock.destroy());
      gates.add(gate);
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

  /**
   * Mentors walk to nearby cells in their zone and rest in between. Close to the player, or
   * while a dialog is open, they stop and face the player (characters face right by default).
   */
  private moveMentors(time: number): void {
    for (const m of this.mentors) {
      m.pos.x = m.body.center.x;
      m.pos.y = m.body.center.y;
      m.figure.setPosition(m.pos.x, m.pos.y);
      m.labels.setPosition(m.pos.x, m.pos.y);
      const dist = Phaser.Math.Distance.Between(m.pos.x, m.pos.y, this.player.x, this.player.y);
      this.updateBubble(m, dist, time);
      if (dist < FACE_RANGE) m.sprite.setFlipX(this.player.x < m.pos.x);
      if (dist < FACE_RANGE || !this.active) {
        m.body.stop();
        continue;
      }
      const next = m.path[0];
      if (!next) {
        m.body.stop();
        if (time < m.restUntil) continue;
        const cell = { x: Math.floor(m.pos.x / TILE), y: Math.floor(m.pos.y / TILE) };
        const path = pickWanderPath(this.map, m.bounds, cell) ?? [];
        m.path = path.map((p) => ({ x: (p.x + 0.5) * TILE, y: (p.y + 0.5) * TILE }));
        m.restUntil = time + Phaser.Math.Between(REST_MS[0], REST_MS[1]);
      } else if (Phaser.Math.Distance.BetweenPoints(m.pos, next) < 2) {
        m.body.reset(next.x, next.y);
        m.path.shift();
      } else {
        this.physics.moveTo(m.body.gameObject, next.x, next.y, WANDER_SPEED);
        if (Math.abs(next.x - m.pos.x) > 1) m.sprite.setFlipX(next.x < m.pos.x);
      }
    }
  }

  /**
   * A showing remark stays while the player is close and disappears LINGER_MS after they
   * leave. Bubbles are hidden while a dialog is open. The bubble sits above the mentor, or
   * below the "[E] Prata" hint if it would go under the HUD, and is kept inside the screen.
   */
  private updateBubble(m: MentorSprite, dist: number, time: number): void {
    if (m.remark === "showing") {
      if (dist < FACE_RANGE) m.hideAt = Math.max(m.hideAt, time + LINGER_MS);
      if (time > m.hideAt) this.hideRemark(m);
    }
    m.bubble.setVisible(this.active && m.bubble.text !== "");
    if (!m.bubble.visible) return;
    const view = this.cameras.main.worldView;
    const above = m.pos.y - view.y - HUD_HEIGHT > TILE * 2.1 + m.bubble.height;
    if (above) m.bubble.setOrigin(0.5, 1).setY(-TILE * 2.1);
    else m.bubble.setOrigin(0.5, 0).setY(TILE * 1.5);
    const half = m.bubble.width / 2 + BUBBLE_MARGIN;
    m.bubble.setX(Phaser.Math.Clamp(m.pos.x, view.x + half, view.right - half) - m.pos.x);
  }

  /** A mentor remarks on something when the player walks up to it, once per approach. */
  private checkRemarks(): void {
    const playerId = this.ui.playerId;
    if (!this.active || !playerId) return;
    for (const m of this.mentors) {
      const near =
        Phaser.Math.Distance.Between(m.pos.x, m.pos.y, this.player.x, this.player.y) < REMARK_RANGE;
      if (near && !m.near && m.remark === "idle") void this.remark(m, playerId);
      m.near = near;
    }
  }

  /**
   * "…" while the remark loads, then the remark. If the player has already walked away it
   * still shows, for a short reading time. A remark that arrives while a dialog is open
   * shows when it closes (the server has already used up the card).
   */
  private async remark(m: MentorSprite, playerId: string): Promise<void> {
    const id = ++m.remarkId;
    m.remark = "loading";
    this.time.delayedCall(THINKING_DELAY, () => {
      if (m.remarkId === id) m.bubble.setText("…");
    });
    let text: string | null = null;
    try {
      text = (await getRemark(m.id, playerId)).remark;
    } catch (err) {
      console.warn("Could not get a remark", err);
    }
    if (m.remarkId !== id) return; // discarded
    if (!text) {
      this.hideRemark(m);
      return;
    }
    m.bubble.setText(text);
    m.remark = "showing";
    m.hideAt = this.time.now + Math.min(2000 + text.length * 50, 6000);
  }

  private hideRemark(m: MentorSprite): void {
    m.remarkId++;
    m.remark = "idle";
    m.bubble.setText("");
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
  private async refreshProgress(): Promise<void> {
    if (!this.ui.playerId) return;
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
      console.warn("Could not refresh the player's progress", err);
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

  update(time: number): void {
    if (!this.body) return;
    this.moveMentors(time);
    this.checkRemarks();
    const mentor = this.nearbyMentor();
    this.hint.setVisible(this.active && !!mentor);
    if (mentor) this.hint.setPosition(mentor.pos.x, mentor.pos.y + TILE);
    if (this.lockHint.visible && this.time.now > this.lockHintUntil)
      this.lockHint.setVisible(false);

    if (!this.active) return;
    this.checkZone();
    const { left, right, up, down } = this.cursors;
    const vx = (right.isDown ? 1 : 0) - (left.isDown ? 1 : 0);
    const vy = (down.isDown ? 1 : 0) - (up.isDown ? 1 : 0);
    this.body.setVelocity(vx * SPEED, vy * SPEED);
    this.animatePlayer(vx, vy, this.isMovingFreely(vx, vy));
  }
}
