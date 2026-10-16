import Phaser from "phaser";
import { getWorld } from "../api/client";
import type { Point, World } from "../api/types";
import { bus } from "../events";
import { nearestWithin, TILE } from "./geometry";
import { buildMap, type MapData } from "./mapgen";
import { EMPTY, TILESET_KEY, TILESET_TILE, TILESET_URL } from "./tiles";

const SPEED = 180;
const TALK_RANGE = TILE * 1.8;

/** The world: a tile map generated from /world, mentors as squares, arrow keys and E. */
export class WorldScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Rectangle;
  private body!: Phaser.Physics.Arcade.Body;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private mentors: { id: string; pos: Point }[] = [];
  private hint!: Phaser.GameObjects.Text;
  private active = false; // true once the player has a name and no modal is open

  constructor() {
    super("world");
  }

  preload(): void {
    this.load.image(TILESET_KEY, TILESET_URL);
  }

  async create(): Promise<void> {
    const keyboard = this.input.keyboard as Phaser.Input.Keyboard.KeyboardPlugin;
    this.cursors = keyboard.createCursorKeys();
    keyboard.on("keydown-E", () => this.interact());

    bus.on("player:ready", () => this.setActive(true));
    bus.on("ui:modal-open", () => this.setActive(false));
    bus.on("ui:modal-close", () => this.setActive(true));

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
    if (!active) this.body?.setVelocity(0, 0);
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
        .setDepth(1);
    }

    const mentorBodies = this.physics.add.staticGroup();
    for (const m of world.mentors) {
      const pos = { x: (m.position.x + 0.5) * TILE, y: (m.position.y + 0.5) * TILE };
      const color = Phaser.Display.Color.HexStringToColor(m.color).color;
      mentorBodies.add(
        this.add.rectangle(pos.x, pos.y, TILE, TILE, color).setStrokeStyle(2, 0xffffff),
      );
      this.add
        .text(pos.x, pos.y - TILE, m.name, {
          fontSize: "14px",
          color: "#fff",
          stroke: "#000",
          strokeThickness: 3,
        })
        .setOrigin(0.5)
        .setDepth(1);
      this.mentors.push({ id: m.id, pos });
    }

    const spawn = { x: (map.spawn.x + 0.5) * TILE, y: (map.spawn.y + 0.5) * TILE };
    this.player = this.add.rectangle(spawn.x, spawn.y, TILE * 0.8, TILE * 0.8, 0xf2e94e);
    this.physics.add.existing(this.player);
    this.body = this.player.body as Phaser.Physics.Arcade.Body;
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

    if (!this.active) return;
    const { left, right, up, down } = this.cursors;
    const vx = (right.isDown ? 1 : 0) - (left.isDown ? 1 : 0);
    const vy = (down.isDown ? 1 : 0) - (up.isDown ? 1 : 0);
    this.body.setVelocity(vx * SPEED, vy * SPEED);
  }
}
