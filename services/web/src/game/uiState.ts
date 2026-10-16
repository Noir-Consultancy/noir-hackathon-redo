/**
 * What the UI has told the game so far. Fed from the bus as soon as the game starts, so
 * events sent while Phaser boots or loads assets are not lost (see #16).
 */
export class UiState {
  private ready = false;
  private id = "";
  private modalOpen = false;
  private listener?: () => void;

  /** The player has a name and no dialog is open. */
  get active(): boolean {
    return this.ready && !this.modalOpen;
  }

  /** The player's id once ready, otherwise "". */
  get playerId(): string {
    return this.id;
  }

  playerReady(playerId: string): void {
    this.ready = true;
    this.id = playerId;
    this.listener?.();
  }

  modalOpened(): void {
    this.modalOpen = true;
    this.listener?.();
  }

  modalClosed(): void {
    this.modalOpen = false;
    this.listener?.();
  }

  /** Calls `fn` now and on every change. */
  onChange(fn: () => void): void {
    this.listener = fn;
    fn();
  }
}
