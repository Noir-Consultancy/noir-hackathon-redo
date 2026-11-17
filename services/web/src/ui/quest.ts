// Quest box in the dialog (owner: package 2): task, answer form, feedback and retry.
import { attemptQuest } from "../api/client";
import type { AttemptResult, Progress, Quest } from "../api/types";
import { el } from "./dom";

/** Why the answer can't be sent yet, or null. Boss quests need at least one marked claim. */
export function answerError(quest: Quest, text: string, selected: number[]): string | null {
  if (!text) return quest.kind === "boss" ? "Motivera varför påståendena är fel." : "";
  if (quest.kind === "boss" && selected.length === 0)
    return "Kryssa i de påståenden du tror är fel.";
  return null;
}

/** Short reward summary shown after a passed attempt, e.g. "+50 XP · Nytt kort: X". */
export function rewardLine(result: AttemptResult): string {
  const parts: string[] = [];
  if (result.xp_awarded > 0) parts.push(`+${result.xp_awarded} XP`);
  if (result.new_card) parts.push(`Nytt kort: ${result.new_card.title}`);
  for (const a of result.new_achievements) parts.push(`Badge: ${a.title}`);
  return parts.join(" · ");
}

export function questBox(
  quest: Quest,
  playerId: string,
  completed: boolean,
  onProgress: (p: Progress) => void,
): HTMLElement {
  const status = el("span", { className: "quest-status" });
  const feedback = el("p", { className: "quest-feedback" });
  const answer = el("textarea", {
    placeholder: "Ditt svar… (Enter skickar, Shift+Enter ny rad)",
    rows: 3,
  });
  const submit = el("button", { type: "submit" }, "Skicka svar");
  // Boss quests: one checkbox per claim; the player marks the wrong ones.
  const checkboxes = quest.statements.map(() => el("input", { type: "checkbox" }));
  const statements = el(
    "ol",
    { className: "quest-statements" },
    ...quest.statements.map((s, i) => el("li", {}, el("label", {}, checkboxes[i], " ", s))),
  );
  const form = el("form", { className: "quest-form" }, answer, submit);
  const box = el(
    "section",
    { className: "quest" },
    el("h3", {}, quest.title, " ", status),
    el("p", { className: "quest-task" }, quest.task),
    ...(quest.statements.length > 0 ? [statements] : []),
    el("p", { className: "quest-xp" }, `${quest.xp} XP`),
    form,
    feedback,
  );

  const markCompleted = () => {
    box.classList.add("done");
    status.textContent = "Klarad ✓";
    form.remove();
    for (const box of checkboxes) box.disabled = true;
  };
  if (completed) markCompleted();

  // Enter submits, Shift+Enter adds a new line. Skip while an IME is composing.
  answer.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      // requestSubmit() ignores the disabled button, so don't resend while waiting.
      if (!submit.disabled) form.requestSubmit();
    }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = answer.value.trim();
    const selected = checkboxes.flatMap((box, i) => (box.checked ? [i] : []));
    const error = answerError(quest, text, selected);
    if (error !== null) {
      feedback.className = "quest-feedback failed";
      feedback.textContent = error;
      return;
    }
    submit.disabled = true;
    feedback.className = "quest-feedback";
    feedback.textContent = "Bedömer ditt svar…";
    let result: AttemptResult;
    try {
      result = await attemptQuest(quest.id, playerId, text, selected);
    } catch {
      feedback.textContent = "Kunde inte skicka svaret. Försök igen.";
      feedback.classList.add("failed");
      return;
    } finally {
      submit.disabled = false;
    }
    feedback.textContent = result.feedback;
    feedback.classList.add(result.passed ? "passed" : "failed");
    if (result.passed) {
      markCompleted();
      const line = rewardLine(result);
      if (line) box.append(el("p", { className: "quest-reward" }, line));
    }
    onProgress(result.progress);
  });

  return box;
}
