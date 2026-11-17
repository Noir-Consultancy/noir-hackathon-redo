// UI overlay (owner: package 2): name prompt, HUD, dialog panel and codex.
import { ApiError, chat, createPlayer, getProgress, getWorld } from "../api/client";
import type { Progress, World } from "../api/types";
import { bus } from "../events";
import { codexPanel } from "./codex";
import { createControls } from "./controls";
import { el } from "./dom";
import { createHud, rewardEvents } from "./hud";
import { createNotifier } from "./notify";
import { questBox } from "./quest";
import { deviceSaves, type Save } from "./saves";

const SLOW_MS = 10_000;

export function startUi(root: HTMLElement): void {
  const saves = deviceSaves();
  // Back to the start menu: reloading also resets the game world for the next player.
  const hud = createHud(() => {
    saves.leave();
    location.reload();
  });
  root.append(hud.root);
  const notify = createNotifier(root, hud.topRight);
  const controls = createControls();
  root.append(controls.root);

  let playerId = "";
  let progress: Progress | null = null;
  let modalOpen = false; // the mentor dialog is open
  let world: Promise<World> | null = null;
  let zones: World["zones"] = []; // for "🔓 … är upplåst!" on level up
  const loadWorld = () => {
    world ??= getWorld().then(
      (w) => {
        zones = w.zones;
        return w;
      },
      (err) => {
        world = null;
        throw err;
      },
    );
    return world;
  };
  void loadWorld().catch(() => undefined);

  const renderHud = (p: Progress) => {
    // No notifications on the first load, only for what is gained while playing.
    if (progress?.player_id === p.player_id) notify(rewardEvents(progress, p, zones));
    progress = p;
    hud.render(p);
  };

  const ready = (p: Progress) => {
    playerId = p.player_id;
    saves.play({ player_id: p.player_id, name: p.name });
    renderHud(p);
    controls.show();
    bus.emit("player:ready", { playerId });
  };

  /** Name prompt for a new game; an existing name continues that save. */
  const askName = (back?: () => void) => {
    const input = el("input", { placeholder: "Ditt namn", maxLength: 40, required: true });
    const error = el("p", { className: "error" });
    const buttons = el("div", { className: "panel-buttons" });
    if (back) {
      const cancel = el("button", { type: "button" }, "Tillbaka");
      cancel.addEventListener("click", () => {
        form.remove();
        back();
      });
      buttons.append(cancel);
    }
    buttons.append(el("button", { type: "submit" }, "Börja"));
    const form = el(
      "form",
      { className: "panel" },
      el("h2", {}, back ? "Nytt spel" : "Välkommen till Kunskapsriket"),
      input,
      buttons,
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

  /** Start menu: continue one of this device's saves, or start a new game. */
  const showMenu = (entries: { save: Save; progress: Progress | null }[]) => {
    const list = el("div", { className: "menu-saves" });
    const panel = el("div", { className: "panel menu" }, el("h2", {}, "Kunskapsriket"), list);
    for (const { save, progress: p } of entries) {
      const label = p ? `Fortsätt som ${p.name} · nivå ${p.level}` : `Fortsätt som ${save.name}`;
      const pick = el("button", { type: "button" }, label);
      pick.addEventListener("click", async () => {
        try {
          ready(p ?? (await getProgress(save.player_id)));
          panel.remove();
        } catch {
          pick.textContent = `${save.name}: kunde inte nå servern, försök igen`;
        }
      });
      list.append(pick);
    }
    const newGame = el("button", { type: "button", className: "menu-new" }, "Nytt spel");
    newGame.addEventListener("click", () => {
      panel.remove();
      askName(() => showMenu(entries));
    });
    panel.append(newGame);
    root.append(panel);
    (list.firstElementChild as HTMLElement | null)?.focus();
  };

  // Fetches each save's progress for the menu; saves the server no longer has are forgotten.
  const loadSaves = () =>
    Promise.all(
      saves.list().map(async (save) => {
        try {
          return { save, progress: await getProgress(save.player_id) };
        } catch (err) {
          if (err instanceof ApiError && err.status === 404) {
            saves.forget(save.player_id);
            return null;
          }
          return { save, progress: null }; // server unreachable: still offer the save
        }
      }),
    ).then((entries) => entries.filter((e) => e !== null));

  const start = async () => {
    const current = saves.current();
    if (current) {
      try {
        ready(await getProgress(current));
        return;
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) saves.forget(current);
      }
    }
    const entries = await loadSaves();
    if (entries.length > 0) showMenu(entries);
    else askName();
  };
  void start();
}
