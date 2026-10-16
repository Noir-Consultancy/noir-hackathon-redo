import Phaser from "phaser";
import { getWorld } from "../api/client";
import type { Point, World } from "../api/types";
import { bus } from "../events";
import { nearestWithin, TILE } from "./geometry";

const SPEED = 180;
const TALK_RANGE = TILE * 1.8;

/** Skeleton world: zones as colored rectangles, mentors as squares, arrow keys and E. */
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

  async create(): Promise<void> {
    const keyboard = this.input.keyboard as Phaser.Input.Keyboard.KeyboardPlugin;
    this.cursors = keyboard.createCursorKeys();
    keyboard.on("keydown-E", () => this.interact());

    bus.on("player:ready", () => this.setActive(true));
    bus.on("ui:modal-open", () => this.setActive(false));
    bus.on("ui:modal-close", () => this.setActive(true));

    const world = await getWorld();
    this.drawWorld(world);
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
    let width = 0;
    let height = 0;
    for (const zone of world.zones) {
      const { x, y, w, h } = zone.bounds;
      const color = Phaser.Display.Color.HexStringToColor(zone.color).color;
      this.add.rectangle(x * TILE, y * TILE, w * TILE, h * TILE, color).setOrigin(0);
      this.add.text(x * TILE + 8, y * TILE + 8, zone.name, { fontSize: "18px", color: "#fff" });
      width = Math.max(width, (x + w) * TILE);
      height = Math.max(height, (y + h) * TILE);
    }

    for (const m of world.mentors) {
      const pos = { x: (m.position.x + 0.5) * TILE, y: (m.position.y + 0.5) * TILE };
      const color = Phaser.Display.Color.HexStringToColor(m.color).color;
      this.add.rectangle(pos.x, pos.y, TILE, TILE, color).setStrokeStyle(2, 0xffffff);
      this.add
        .text(pos.x, pos.y - TILE, m.name, { fontSize: "14px", color: "#fff" })
        .setOrigin(0.5);
      this.mentors.push({ id: m.id, pos });
    }

    this.player = this.add.rectangle(width / 2, height / 2, TILE * 0.8, TILE * 0.8, 0xf2e94e);
    this.physics.add.existing(this.player);
    this.body = this.player.body as Phaser.Physics.Arcade.Body;
    this.body.setCollideWorldBounds(true);
    this.physics.world.setBounds(0, 0, width, height);
    this.cameras.main.setBounds(0, 0, width, height).startFollow(this.player);

    this.hint = this.add
      .text(0, 0, "[E] Prata", { fontSize: "14px", color: "#fff", backgroundColor: "#000" })
      .setOrigin(0.5)
      .setVisible(false);
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
