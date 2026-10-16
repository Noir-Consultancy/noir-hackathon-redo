// HUD panel (owner: package 2): level badge, XP bar and card/badge counters.
import type { Progress } from "../api/types";
import { el } from "./dom";

export interface RewardEvent {
  kind: "card" | "achievement" | "level";
  text: string;
}

/** What the player gained between two progress snapshots. */
export function rewardEvents(prev: Progress, next: Progress): RewardEvent[] {
  const events: RewardEvent[] = [];
  const hadCard = new Set(prev.cards.map((c) => c.id));
  for (const c of next.cards) {
    if (!hadCard.has(c.id)) events.push({ kind: "card", text: `🃏 Nytt kort: ${c.title}` });
  }
  const hadBadge = new Set(prev.achievements.map((a) => a.id));
  for (const a of next.achievements) {
    if (!hadBadge.has(a.id)) events.push({ kind: "achievement", text: `🏅 ${a.title}` });
  }
  if (next.level > prev.level) events.push({ kind: "level", text: `⬆ Nivå ${next.level}!` });
  return events;
}

export function createHud() {
  const level = el("div", { className: "hud-level" });
  const name = el("div", { className: "hud-name" });
  const fill = el("div", { className: "hud-xp-fill" });
  const xpText = el("span", { className: "hud-xp-text" });
  const counts = el("div", { className: "hud-counts" });
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
    // XP within the current level: level = 1 + xp // 100, xp_for_next_level = level * 100.
    const floor = (p.level - 1) * 100;
    const span = p.xp_for_next_level - floor;
    const pct = span > 0 ? Math.min(100, ((p.xp - floor) / span) * 100) : 0;
    fill.style.width = `${pct}%`;
    xpText.textContent = `${p.xp}/${p.xp_for_next_level}`;
    counts.textContent = `🃏 ${p.cards.length}   🏅 ${p.achievements.length}`;
  };

  return { root, render };
}
