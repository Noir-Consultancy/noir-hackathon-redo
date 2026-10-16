// UI overlay (owner: package 2): name prompt, HUD and a minimal dialog panel.
import { chat, createPlayer, getProgress, getWorld } from "../api/client";
import type { Progress, World } from "../api/types";
import { bus } from "../events";
import { el } from "./dom";
import { questBox } from "./quest";

const PLAYER_KEY = "kunskapsriket.playerId";

export function startUi(root: HTMLElement): void {
  const hud = el("div", { className: "hud" });
  root.append(hud);

  let playerId = "";
  let progress: Progress | null = null;
  let world: Promise<World> | null = null;
  const loadWorld = () => {
    world ??= getWorld().catch((err) => {
      world = null;
      throw err;
    });
    return world;
  };

  const renderHud = (p: Progress) => {
    progress = p;
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
    const questSlot = el("div", { className: "quest-slot" });
    const panel = el("div", { className: "panel dialog" }, close, log, questSlot, form);

    const showQuest = async (questId: string) => {
      if (questSlot.dataset.questId === questId) return;
      const quest = (await loadWorld()).quests.find((q) => q.id === questId);
      if (!quest) return;
      questSlot.dataset.questId = questId;
      const completed = progress?.completed_quests.includes(questId) ?? false;
      questSlot.replaceChildren(questBox(quest, playerId, completed, renderHud));
    };

    // Already completed: show the mentor's quest as "Klarad ✓" right away.
    void loadWorld()
      .then((w) => {
        const questId = w.mentors.find((m) => m.id === npcId)?.quest_id;
        if (questId && progress?.completed_quests.includes(questId)) return showQuest(questId);
      })
      .catch(() => undefined);

    const say = async (message: string) => {
      if (message) log.append(el("p", { className: "me" }, message));
      const res = await chat(npcId, playerId, message);
      log.append(el("p", { className: "npc" }, res.reply));
      if (res.offered_quest_id) await showQuest(res.offered_quest_id).catch(() => undefined);
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
