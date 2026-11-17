// Codex (owner: package 2): the player's knowledge cards, badges and completed quests.
import type { Achievement, Card, Progress, World } from "../api/types";
import { el } from "./dom";

export interface CodexCard {
  id: string;
  mentor: string;
  color: string;
  /** Full card when unlocked, null while it is still "???". */
  card: Card | null;
  /** Level needed to reach the mentor's zone, when above the player's level. */
  requiredLevel: number | null;
}

/** All cards in the world, in world order, with the unlocked ones filled in. */
export function codexCards(world: World, progress: Progress): CodexCard[] {
  const unlocked = new Map(progress.cards.map((c) => [c.id, c]));
  return world.cards.map((c) => {
    const mentor = world.mentors.find((m) => m.id === c.mentor_id);
    const zone = world.zones.find((z) => z.id === mentor?.zone_id);
    const needed = zone?.required_level ?? 1;
    return {
      id: c.id,
      mentor: mentor?.name ?? "",
      color: mentor?.color ?? "#888",
      card: unlocked.get(c.id) ?? null,
      requiredLevel: needed > progress.level ? needed : null,
    };
  });
}

function cardDetail(c: CodexCard): HTMLElement {
  const card = c.card as Card;
  return el(
    "article",
    { className: "codex-detail" },
    el("h3", {}, card.title, " ", el("small", {}, `· ${c.mentor}`)),
    el("p", {}, card.summary),
    el("p", {}, el("strong", {}, "När det passar: "), card.when_to_use),
    el("p", {}, el("strong", {}, "Fallgropar: "), card.pitfalls),
  );
}

function badge(a: Achievement, unlocked: boolean): HTMLElement {
  return el(
    "li",
    // Locked badges already show the description as a hint, so no tooltip there.
    unlocked ? { className: "badge", title: a.description } : { className: "badge locked" },
    unlocked ? `🏅 ${a.title}` : `░ ${a.description}`,
  );
}

/** Builds the codex panel. `onClose` is called by the close button. */
export function codexPanel(world: World, progress: Progress, onClose: () => void): HTMLElement {
  const cards = codexCards(world, progress);
  const unlockedCount = cards.filter((c) => c.card).length;
  const detail = el("div", { className: "codex-detail-slot" });

  const grid = el("div", { className: "codex-grid" });
  for (const c of cards) {
    const tile = el(
      "button",
      { type: "button", className: c.card ? "codex-card" : "codex-card locked" },
      c.card ? el("span", { className: "codex-mentor" }, c.mentor) : c.requiredLevel ? "🔒" : "?",
      c.card ? c.card.title : c.requiredLevel ? `Kräver nivå ${c.requiredLevel}` : "???",
    );
    tile.style.setProperty("--mentor", c.color);
    if (c.card) {
      tile.addEventListener("click", () => {
        for (const t of grid.children) t.classList.remove("selected");
        tile.classList.add("selected");
        detail.replaceChildren(cardDetail(c));
      });
    } else {
      tile.disabled = true;
    }
    grid.append(tile);
  }

  const hadBadge = new Set(progress.achievements.map((a) => a.id));
  const badges = el(
    "ul",
    { className: "codex-badges" },
    ...world.achievements.map((a) => badge(a, hadBadge.has(a.id))),
  );

  const done = world.quests.filter((q) => progress.completed_quests.includes(q.id));
  const quests = done.length
    ? el("ul", { className: "codex-quests" }, ...done.map((q) => el("li", {}, `✓ ${q.title}`)))
    : el("p", { className: "codex-empty" }, "Inga klarade quests än. Prata med en mentor!");

  const close = el("button", { type: "button", className: "close" }, "Stäng (Esc / C)");
  close.addEventListener("click", onClose);

  return el(
    "div",
    { className: "panel codex" },
    close,
    el("h2", {}, "Codex ", el("small", {}, `${unlockedCount}/${cards.length} kort`)),
    grid,
    detail,
    el("h3", {}, "Badges"),
    badges,
    el("h3", {}, "Klarade quests"),
    quests,
  );
}
