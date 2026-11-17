// HUD panel (owner: package 2): level badge, XP bar and card/badge counters.
import type { Progress, Zone } from "../api/types";
import { el } from "./dom";

export interface RewardEvent {
  kind: "card" | "achievement" | "level";
  text: string;
}

/** What the player gained between two progress snapshots, incl. zones a level up opens. */
export function rewardEvents(prev: Progress, next: Progress, zones: Zone[] = []): RewardEvent[] {
  const events: RewardEvent[] = [];
  const hadCard = new Set(prev.cards.map((c) => c.id));
  for (const c of next.cards) {
    if (!hadCard.has(c.id)) events.push({ kind: "card", text: `🃏 Nytt kort: ${c.title}` });
  }
  const hadBadge = new Set(prev.achievements.map((a) => a.id));
  for (const a of next.achievements) {
    if (!hadBadge.has(a.id)) events.push({ kind: "achievement", text: `🏅 ${a.title}` });
  }
  if (next.level > prev.level) {
    const opened = zones.filter(
      (z) => z.required_level > prev.level && z.required_level <= next.level,
    );
    const lines = [`⬆ Nivå ${next.level}!`, ...opened.map((z) => `🔓 ${z.name} är upplåst!`)];
    events.push({ kind: "level", text: lines.join("\n") });
  }
  return events;
}

/** `onMenu` is called by the HUD's "Meny" button. */
export function createHud(onMenu: () => void) {
  const level = el("div", { className: "hud-level" });
  const name = el("div", { className: "hud-name" });
  const fill = el("div", { className: "hud-xp-fill" });
  const xpText = el("span", { className: "hud-xp-text" });
  const cardCount = el("span");
  const badgeCount = el("span");
  const menu = el("button", { type: "button", className: "hud-menu" }, "Meny");
  menu.addEventListener("click", onMenu);
  const counts = el("div", { className: "hud-counts" }, cardCount, badgeCount, menu);
  const root = el(
    "div",
    { className: "hud" },
    level,
    el(
      "div",
      { className: "hud-body" },
      name,
      el("div", { className: "hud-xp" }, el("div", { className: "hud-xp-bar" }, fill), xpText),
      counts,
    ),
  );
  root.hidden = true;

  const render = (p: Progress) => {
    root.hidden = false;
    level.replaceChildren(el("small", {}, "Nv"), String(p.level));
    name.textContent = p.name;
    // XP within the current level. The step comes from the server's xp_for_next_level
    // (level * step), so the bar follows if the formula changes.
    const step = p.xp_for_next_level / p.level;
    const floor = p.xp_for_next_level - step;
    const pct = step > 0 ? Math.min(100, Math.max(0, ((p.xp - floor) / step) * 100)) : 0;
    fill.style.width = `${pct}%`;
    xpText.textContent = `${p.xp}/${p.xp_for_next_level}`;
    cardCount.textContent = `🃏 ${p.cards.length}`;
    badgeCount.textContent = `🏅 ${p.achievements.length}`;
  };

  return { root, render };
}
