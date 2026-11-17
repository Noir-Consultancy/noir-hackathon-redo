import Phaser from "phaser";
import { getProgress, getRemark, getWorld } from "../api/client";
import type { Point, Rect, World, Zone } from "../api/types";
import { bus } from "../events";
import { nearestWithin, TILE } from "./geometry";
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

interface MentorSprite {
  id: string;
  pos: Point; // pixels, follows the body
  body: Phaser.Physics.Arcade.Body;
  view: Phaser.GameObjects.Container; // sprite, name, marker and bubble
  sprite: Phaser.GameObjects.Sprite;
  questId: string;
  marker: Phaser.GameObjects.Text;
  bubble: Phaser.GameObjects.Text;
  bounds: Rect; // the mentor's zone, in tiles
  path: Point[]; // remaining waypoints, pixels
  restUntil: number; // scene time
  near: boolean; // player within REMARK_RANGE last frame
  talking: boolean; // a remark is loading or showing
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
    this.map = map;

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
          wordWrap: { width: TILE * 7 },
        })
        .setOrigin(0.5, 1)
        .setVisible(false);
      const view = this.add.container(pos.x, pos.y, [sprite, name, marker, bubble]).setDepth(2);
      const zone = world.zones.find((z) => z.id === m.zone_id);
      this.mentors.push({
        id: m.id,
        pos,
        body,
        view,
        sprite,
        questId: m.quest_id,
        marker,
        bubble,
        bounds: zone?.bounds ?? { ...m.position, w: 1, h: 1 },
        path: [],
        restUntil: 0,
        near: false,
        talking: false,
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

  /**
   * Mentors walk to nearby cells in their zone and rest in between. Close to the player, or
   * while a dialog is open, they stop and face the player (characters face right by default).
   */
  private moveMentors(time: number): void {
    for (const m of this.mentors) {
      m.pos.x = m.body.center.x;
      m.pos.y = m.body.center.y;
      m.view.setPosition(m.pos.x, m.pos.y);
      this.placeBubble(m);
      const dist = Phaser.Math.Distance.Between(m.pos.x, m.pos.y, this.player.x, this.player.y);
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

  /** Above the mentor, or below it if it would go off the top of the screen. */
  private placeBubble(m: MentorSprite): void {
    if (!m.bubble.visible) return;
    const above = m.pos.y - this.cameras.main.worldView.y > TILE * 2.1 + m.bubble.height;
    if (above) m.bubble.setOrigin(0.5, 1).setY(-TILE * 2.1);
    else m.bubble.setOrigin(0.5, 0).setY(TILE * 0.6);
  }

  /** A mentor remarks on something when the player walks up to it, once per approach. */
  private checkRemarks(): void {
    const playerId = this.ui.playerId;
    if (!this.active || !playerId) return;
    for (const m of this.mentors) {
      const near =
        Phaser.Math.Distance.Between(m.pos.x, m.pos.y, this.player.x, this.player.y) < REMARK_RANGE;
      if (near && !m.near && !m.talking) void this.remark(m, playerId);
      m.near = near;
    }
  }

  /** "…" while the remark loads, then the remark for a while, even if the player walks away. */
  private async remark(m: MentorSprite, playerId: string): Promise<void> {
    m.talking = true;
    const thinking = this.time.delayedCall(THINKING_DELAY, () =>
      m.bubble.setText("…").setVisible(true),
    );
    let text: string | null = null;
    try {
      text = (await getRemark(m.id, playerId)).remark;
    } catch (err) {
      console.warn("Could not get a remark", err);
    }
    thinking.remove();
    if (!text) {
      m.bubble.setVisible(false);
      m.talking = false;
      return;
    }
    m.bubble.setText(text).setVisible(true);
    this.time.delayedCall(Math.min(3000 + text.length * 60, 12000), () => {
      m.bubble.setVisible(false);
      m.talking = false;
    });
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

  /** Updates "!" / "✓" from the player's completed quests; keeps them as they are on errors. */
  private async refreshMarkers(): Promise<void> {
    if (!this.ui.playerId || this.mentors.length === 0) return;
    try {
      const { completed_quests } = await getProgress(this.ui.playerId);
      for (const m of this.mentors) {
        const style = MARKER_STYLE[markerFor(m.questId, completed_quests)];
        m.marker.setText(style.text).setColor(style.color);
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

  update(time: number): void {
    if (!this.body) return;
    this.moveMentors(time);
    this.checkRemarks();
    const mentor = this.nearbyMentor();
    this.hint.setVisible(this.active && !!mentor);
    if (mentor) this.hint.setPosition(mentor.pos.x, mentor.pos.y + TILE);

    if (!this.active) return;
    this.checkZone();
    const { left, right, up, down } = this.cursors;
    const vx = (right.isDown ? 1 : 0) - (left.isDown ? 1 : 0);
    const vy = (down.isDown ? 1 : 0) - (up.isDown ? 1 : 0);
    this.body.setVelocity(vx * SPEED, vy * SPEED);
    this.animatePlayer(vx, vy, this.isMovingFreely(vx, vy));
  }
}
