// Controls hint (owner: package 2): a small "? Kontroller" button that unfolds the keys.
import { el } from "./dom";

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

  // Show the folded button once the player is in the game.
  const show = () => {
    root.hidden = false;
    setOpen(false);
  };

  return { root, show };
}
