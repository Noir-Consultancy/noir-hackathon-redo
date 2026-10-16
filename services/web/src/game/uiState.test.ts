import { describe, expect, it, vi } from "vitest";
import { UiState } from "./uiState";

describe("UiState", () => {
  it("remembers player:ready sent before the scene subscribes", () => {
    const state = new UiState();
    state.playerReady(); // UI was faster than the asset loading
    const listener = vi.fn(() => state.active);
    state.onChange(listener);
    expect(listener).toHaveReturnedWith(true);
  });

  it("is inactive while a modal is open, and before the player is ready", () => {
    const state = new UiState();
    state.modalClosed();
    expect(state.active).toBe(false);
    state.playerReady();
    state.modalOpened();
    expect(state.active).toBe(false);
    state.modalClosed();
    expect(state.active).toBe(true);
  });
});
