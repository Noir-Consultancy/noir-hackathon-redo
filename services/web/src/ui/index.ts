// UI overlay (owner: package 2): name prompt, HUD, dialog panel and codex.
import { chat, createPlayer, getProgress, getWorld } from "../api/client";
import type { Progress, World } from "../api/types";
import { bus } from "../events";
import { codexPanel } from "./codex";
import { createControls } from "./controls";
import { el } from "./dom";
import { createHud, rewardEvents } from "./hud";
import { createNotifier } from "./notify";
import { questBox } from "./quest";

const PLAYER_KEY = "kunskapsriket.playerId";
const SLOW_MS = 10_000;

export function startUi(root: HTMLElement): void {
  const hud = createHud();
  root.append(hud.root);
  const notify = createNotifier(root);
  const controls = createControls();
  root.append(controls.root);

  let playerId = "";
  let progress: Progress | null = null;
  let modalOpen = false; // the mentor dialog is open
  let world: Promise<World> | null = null;
  const loadWorld = () => {
    world ??= getWorld().catch((err) => {
      world = null;
      throw err;
    });
    return world;
  };

  const renderHud = (p: Progress) => {
    // No notifications on the first load, only for what is gained while playing.
    if (progress?.player_id === p.player_id) notify(rewardEvents(progress, p));
    progress = p;
    hud.render(p);
  };

  const ready = (p: Progress) => {
    playerId = p.player_id;
    try {
      localStorage.setItem(PLAYER_KEY, playerId);
    } catch {
      // Storage unavailable: the player just enters the name again next time.
    }
    renderHud(p);
    controls.show();
    bus.emit("player:ready", { playerId });
  };

  const askName = () => {
    const input = el("input", { placeholder: "Ditt namn", maxLength: 40, required: true });
    const error = el("p", { className: "error" });
    const form = el(
      "form",
      { className: "panel" },
      el("h2", {}, "Välkommen till Kunskapsriket"),
      input,
      el("button", { type: "submit" }, "Börja"),
      error,
    );
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      error.textContent = "";
      try {
        ready(await createPlayer(input.value.trim()));
        form.remove();
      } catch {
        error.textContent = "Kunde inte nå servern. Försök igen om en stund.";
      }
    });
    root.append(form);
    input.focus();
  };

  const openDialog = async (npcId: string) => {
    modalOpen = true;
    bus.emit("ui:modal-open", {});
    const log = el("div", { className: "log" });
    const input = el("input", { placeholder: "Fråga mentorn…" });
    const form = el("form", {}, input, el("button", { type: "submit" }, "Skicka"));
    const close = el("button", { type: "button", className: "close" }, "Stäng (Esc)");
    const questSlot = el("div", { className: "quest-slot" });
    const panel = el("div", { className: "panel dialog" }, close, log, questSlot, form);

    // Without world data the dialog still works, just without the quest box.
    const world = await loadWorld().catch(() => null);
    const isCompleted = (questId: string) => progress?.completed_quests.includes(questId) ?? false;

    const showQuest = (questId: string) => {
      if (questSlot.dataset.questId === questId) return;
      const quest = world?.quests.find((q) => q.id === questId);
      if (!quest) return;
      questSlot.dataset.questId = questId;
      questSlot.replaceChildren(questBox(quest, playerId, isCompleted(questId), renderHud));
    };

    // Already completed: show the mentor's quest as "Klarad ✓" right away.
    const ownQuestId = world?.mentors.find((m) => m.id === npcId)?.quest_id;
    if (ownQuestId && isCompleted(ownQuestId)) showQuest(ownQuestId);

    const mentorName = world?.mentors.find((m) => m.id === npcId)?.name ?? "Mentorn";
    const send = form.querySelector("button") as HTMLButtonElement;

    const say = async (message: string) => {
      if (message) log.append(el("p", { className: "me" }, message));
      const thinking = el("p", { className: "npc thinking" }, `${mentorName} tänker`);
      log.append(thinking);
      log.scrollTop = log.scrollHeight;
      send.disabled = true;
      // Local models can be slow: tell the player after a while that we are still waiting.
      const slow = setTimeout(() => {
        thinking.textContent = `${mentorName} tänker länge, vänta lite till`;
      }, SLOW_MS);
      try {
        const res = await chat(npcId, playerId, message);
        thinking.replaceWith(el("p", { className: "npc" }, res.reply));
        if (res.offered_quest_id) showQuest(res.offered_quest_id);
      } catch {
        thinking.replaceWith(
          el(
            "p",
            { className: "error" },
            `${mentorName} kunde inte svara just nu. Försök igen om en stund.`,
          ),
        );
      } finally {
        clearTimeout(slow);
        send.disabled = false;
        log.scrollTop = log.scrollHeight;
      }
    };

    const onKey = (e: KeyboardEvent) => e.key === "Escape" && done();
    const done = () => {
      panel.remove();
      window.removeEventListener("keydown", onKey);
      modalOpen = false;
      bus.emit("ui:modal-close", {});
    };
    close.addEventListener("click", done);
    window.addEventListener("keydown", onKey);
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      // Enter still submits while the button is disabled: wait for the pending reply.
      if (send.disabled) return;
      const message = input.value.trim();
      input.value = "";
      if (message) void say(message);
    });

    root.append(panel);
    input.focus();
    await say("");
  };

  bus.on("npc:interact", ({ npcId }) => void openDialog(npcId));

  // Codex on C. Only while playing: not before the name is set or over another modal.
  let codex: HTMLElement | null = null;
  const closeCodex = () => {
    if (!codex) return;
    codex.remove();
    codex = null;
    bus.emit("ui:modal-close", {});
  };
  const openCodex = async () => {
    if (!progress) return;
    const w = await loadWorld().catch(() => null);
    if (!w || !progress || modalOpen || codex) return;
    bus.emit("ui:modal-open", {});
    codex = codexPanel(w, progress, closeCodex);
    root.append(codex);
  };
  window.addEventListener("keydown", (e) => {
    // Holding C or pressing Cmd/Ctrl+C (copy) should not toggle the codex.
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    const typing = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;
    if (codex && (e.key === "Escape" || (!typing && e.key.toLowerCase() === "c"))) closeCodex();
    else if (!codex && !typing && !modalOpen && e.key.toLowerCase() === "c") void openCodex();
  });

  let saved: string | null = null;
  try {
    saved = localStorage.getItem(PLAYER_KEY);
  } catch {
    saved = null;
  }
  if (saved) getProgress(saved).then(ready, askName);
  else askName();
}
