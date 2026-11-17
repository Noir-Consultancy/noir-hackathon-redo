import { describe, expect, it } from "vitest";
import type { Progress } from "../api/types";
import { rewardEvents } from "./hud";

const start: Progress = {
  player_id: "p",
  name: "Emma",
  xp: 50,
  level: 1,
  xp_for_next_level: 100,
  completed_quests: [],
  cards: [],
  achievements: [],
};

describe("rewardEvents", () => {
  it("reports new cards, achievements and level up", () => {
    const next: Progress = {
      ...start,
      xp: 100,
      level: 2,
      xp_for_next_level: 200,
      cards: [
        {
          id: "c",
          title: "Granska AI-kod",
          mentor_id: "ada",
          summary: "",
          when_to_use: "",
          pitfalls: "",
        },
      ],
      achievements: [{ id: "first-quest", title: "Första questen!", description: "" }],
    };
    expect(rewardEvents(start, next)).toEqual([
      { kind: "card", text: "🃏 Nytt kort: Granska AI-kod" },
      { kind: "achievement", text: "🏅 Första questen!" },
      { kind: "level", text: "⬆ Nivå 2!" },
    ]);
  });

  it("reports a level up on its own", () => {
    const next: Progress = { ...start, xp: 100, level: 2, xp_for_next_level: 200 };
    expect(rewardEvents(start, next)).toEqual([{ kind: "level", text: "⬆ Nivå 2!" }]);
  });

  it("lists zones the level up unlocks in the level banner", () => {
    const next: Progress = { ...start, xp: 100, level: 2, xp_for_next_level: 200 };
    const zone = (name: string, required_level: number) => ({
      id: name,
      name,
      topic: "",
      bounds: { x: 0, y: 0, w: 1, h: 1 },
      color: "#000",
      required_level,
    });
    const zones = [zone("Agentbyn", 1), zone("RAG-biblioteket", 2), zone("Senare", 3)];
    expect(rewardEvents(start, next, zones)).toEqual([
      { kind: "level", text: "⬆ Nivå 2!\n🔓 RAG-biblioteket är upplåst!" },
    ]);
  });

  it("reports nothing when progress is unchanged", () => {
    expect(rewardEvents(start, { ...start })).toEqual([]);
  });
});
