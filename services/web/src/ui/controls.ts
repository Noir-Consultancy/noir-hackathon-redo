// Controls hint (owner: package 2): shown when play starts, folds into a small button.
import { el } from "./dom";

const COLLAPSE_MS = 30_000;
const CONTROLS = "Piltangenter: gå · E: prata · C: codex · Esc: stäng";

export function createControls(): { root: HTMLElement; show: () => void } {
  const text = el("span", { className: "controls-text" }, CONTROLS);
  const toggle = el("button", { type: "button", className: "controls-toggle" });
  const root = el("div", { className: "controls" }, toggle, text);
  root.hidden = true;

  const setOpen = (open: boolean) => {
    root.classList.toggle("collapsed", !open);
    toggle.textContent = open ? "✕" : "? Kontroller";
    toggle.title = open ? "Fäll ihop" : "Visa kontroller";
  };
  toggle.addEventListener("click", () => {
    setOpen(root.classList.contains("collapsed"));
    toggle.blur(); // keep Space/Enter for the game, not this button
  });

  // Show once the player is in the game, then fold away after a while.
  const show = () => {
    if (!root.hidden) return;
    root.hidden = false;
    setOpen(true);
    setTimeout(() => setOpen(false), COLLAPSE_MS);
  };

  return { root, show };
}
