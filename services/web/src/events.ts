// Event bus between the game (package 1) and the UI (package 2).
// See docs/contract/interfaces.md – change only with both owners' ok.
import Phaser from "phaser";

export interface BusEvents {
  "player:ready": { playerId: string };
  "npc:interact": { npcId: string };
  "ui:modal-open": Record<string, never>;
  "ui:modal-close": Record<string, never>;
}

const emitter = new Phaser.Events.EventEmitter();

export const bus = {
  emit<K extends keyof BusEvents>(event: K, payload: BusEvents[K]): void {
    emitter.emit(event, payload);
  },
  on<K extends keyof BusEvents>(event: K, handler: (payload: BusEvents[K]) => void): void {
    emitter.on(event, handler);
  },
  off<K extends keyof BusEvents>(event: K, handler: (payload: BusEvents[K]) => void): void {
    emitter.off(event, handler);
  },
};
