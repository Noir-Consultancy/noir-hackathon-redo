// Game (owner: package 1).
import Phaser from "phaser";
import { bus } from "../events";
import { UiState } from "./uiState";
import { WorldScene } from "./WorldScene";

export function startGame(parent: HTMLElement): Phaser.Game {
  // Listen before Phaser boots: the UI may send player:ready before the scene exists.
  const ui = new UiState();
  bus.on("player:ready", ({ playerId }) => ui.playerReady(playerId));
  bus.on("ui:modal-open", () => ui.modalOpened());
  bus.on("ui:modal-close", () => ui.modalClosed());

  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: 960,
    height: 640,
    backgroundColor: "#1d1d1d",
    pixelArt: true,
    physics: { default: "arcade" },
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: [new WorldScene(ui)],
  });
}
