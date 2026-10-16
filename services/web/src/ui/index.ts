// UI overlay (owner: package 2): name prompt, HUD and a minimal dialog panel.
import { chat, createPlayer, getProgress } from "../api/client";
import type { Progress } from "../api/types";
import { bus } from "../events";

const PLAYER_KEY = "kunskapsriket.playerId";

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Partial<HTMLElementTagNameMap[K]> = {},
  ...children: (Node | string)[]
): HTMLElementTagNameMap[K] {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children);
  return node;
}

export function startUi(root: HTMLElement): void {
  const hud = el("div", { className: "hud" });
  root.append(hud);

  let playerId = "";

  const renderHud = (p: Progress) => {
    hud.textContent = `${p.name} · Nivå ${p.level} · ${p.xp}/${p.xp_for_next_level} XP · Kort ${p.cards.length} · Badges ${p.achievements.length}`;
  };

  const ready = (p: Progress) => {
    playerId = p.player_id;
    try {
      localStorage.setItem(PLAYER_KEY, playerId);
    } catch {
      // Storage unavailable: the player just enters the name again next time.
    }
    renderHud(p);
    bus.emit("player:ready", { playerId });
  };

  const askName = () => {
    const input = el("input", { placeholder: "Ditt namn", maxLength: 40, required: true });
    const form = el(
      "form",
      { className: "panel" },
      el("h2", {}, "Välkommen till Kunskapsriket"),
      input,
      el("button", { type: "submit" }, "Börja"),
    );
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      ready(await createPlayer(input.value.trim()));
      form.remove();
    });
    root.append(form);
    input.focus();
  };

  const openDialog = async (npcId: string) => {
    bus.emit("ui:modal-open", {});
    const log = el("div", { className: "log" });
    const input = el("input", { placeholder: "Fråga mentorn…" });
    const form = el("form", {}, input, el("button", { type: "submit" }, "Skicka"));
    const close = el("button", { type: "button", className: "close" }, "Stäng (Esc)");
    const panel = el("div", { className: "panel dialog" }, close, log, form);

    const say = async (message: string) => {
      if (message) log.append(el("p", { className: "me" }, message));
      const res = await chat(npcId, playerId, message);
      log.append(el("p", { className: "npc" }, res.reply));
      // TODO(package 2): show the offered quest (res.offered_quest_id) and an answer form.
      log.scrollTop = log.scrollHeight;
    };

    const onKey = (e: KeyboardEvent) => e.key === "Escape" && done();
    const done = () => {
      panel.remove();
      window.removeEventListener("keydown", onKey);
      bus.emit("ui:modal-close", {});
    };
    close.addEventListener("click", done);
    window.addEventListener("keydown", onKey);
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const message = input.value.trim();
      input.value = "";
      if (message) void say(message);
    });

    root.append(panel);
    input.focus();
    await say("");
  };

  bus.on("npc:interact", ({ npcId }) => void openDialog(npcId));

  let saved: string | null = null;
  try {
    saved = localStorage.getItem(PLAYER_KEY);
  } catch {
    saved = null;
  }
  if (saved) getProgress(saved).then(ready, askName);
  else askName();
}
