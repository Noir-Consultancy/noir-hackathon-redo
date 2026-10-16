// Game (owner: package 1).
import Phaser from "phaser";
import { WorldScene } from "./WorldScene";

export function startGame(parent: HTMLElement): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: 960,
    height: 640,
    backgroundColor: "#1d1d1d",
    pixelArt: true,
    physics: { default: "arcade" },
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: [WorldScene],
  });
}
