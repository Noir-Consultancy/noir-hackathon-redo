import { describe, expect, it } from "vitest";
import type { AttemptResult, Quest } from "../api/types";
import { answerError, rewardLine } from "./quest";

const base: AttemptResult = {
  passed: true,
  feedback: "Bra!",
  xp_awarded: 50,
  new_card: null,
  new_achievements: [],
  progress: {
    player_id: "p",
    name: "Emma",
    xp: 50,
    level: 1,
    xp_for_next_level: 100,
    completed_quests: ["q-ada-1"],
    cards: [],
    achievements: [],
  },
};

describe("rewardLine", () => {
  it("lists xp, new card and achievements", () => {
    const line = rewardLine({
      ...base,
      new_card: {
        id: "c",
        title: "Granska AI-kod",
        mentor_id: "ada",
        summary: "",
        when_to_use: "",
        pitfalls: "",
      },
      new_achievements: [{ id: "first-quest", title: "Första questen!", description: "" }],
    });
    expect(line).toBe("+50 XP · Nytt kort: Granska AI-kod · Badge: Första questen!");
  });

  it("is empty when nothing was awarded", () => {
    expect(rewardLine({ ...base, xp_awarded: 0 })).toBe("");
  });
});

describe("answerError", () => {
  const quest: Quest = {
    id: "q-ada-1",
    mentor_id: "ada",
    title: "Granska",
    task: "Förklara.",
    kind: "explain",
    xp: 50,
    card_id: "c",
    statements: [],
  };
  const boss: Quest = { ...quest, id: "q-oracle-1", kind: "boss", statements: ["a", "b"] };

  it("lets a normal answer through and silently skips an empty one", () => {
    expect(answerError(quest, "Mitt svar", [])).toBeNull();
    expect(answerError(quest, "", [])).toBe("");
  });

  it("asks a boss answer for both marked claims and a motivation", () => {
    expect(answerError(boss, "För att…", [])).toMatch(/Kryssa/);
    expect(answerError(boss, "", [1])).toMatch(/Motivera/);
    expect(answerError(boss, "För att…", [1])).toBeNull();
  });
});
