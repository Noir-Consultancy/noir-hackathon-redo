// Quest box in the dialog (owner: package 2): task, answer form, feedback and retry.
import { attemptQuest } from "../api/client";
import type { AttemptResult, Progress, Quest } from "../api/types";
import { el } from "./dom";

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
  const answer = el("textarea", { placeholder: "Ditt svar…", rows: 3 });
  const submit = el("button", { type: "submit" }, "Skicka svar");
  const form = el("form", { className: "quest-form" }, answer, submit);
  const box = el(
    "section",
    { className: "quest" },
    el("h3", {}, quest.title, " ", status),
    el("p", { className: "quest-task" }, quest.task),
    el("p", { className: "quest-xp" }, `${quest.xp} XP`),
    form,
    feedback,
  );

  const markCompleted = () => {
    box.classList.add("done");
    status.textContent = "Klarad ✓";
    form.remove();
  };
  if (completed) markCompleted();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = answer.value.trim();
    if (!text) return;
    submit.disabled = true;
    feedback.className = "quest-feedback";
    feedback.textContent = "Bedömer ditt svar…";
    let result: AttemptResult;
    try {
      result = await attemptQuest(quest.id, playerId, text);
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
