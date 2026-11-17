import { describe, expect, it } from "vitest";
import type { Progress, World } from "../api/types";
import { codexCards } from "./codex";

const world: World = {
  zones: [],
  mentors: [
    {
      id: "ada",
      name: "Ada",
      title: "",
      zone_id: "z",
      position: { x: 0, y: 0 },
      color: "#e07a5f",
      quest_id: "q-ada-1",
    },
    {
      id: "karl",
      name: "Karl",
      title: "",
      zone_id: "z",
      position: { x: 0, y: 0 },
      color: "#3d5a80",
      quest_id: "q-karl-1",
    },
  ],
  quests: [],
  cards: [
    { id: "c-ada", title: "Granska AI-kod", mentor_id: "ada" },
    { id: "c-karl", title: "Kontextfönstret", mentor_id: "karl" },
  ],
  achievements: [],
};

const unlocked = {
  id: "c-ada",
  title: "Granska AI-kod",
  mentor_id: "ada",
  summary: "s",
  when_to_use: "w",
  pitfalls: "p",
};

const progress: Progress = {
  player_id: "p",
  name: "Emma",
  xp: 50,
  level: 1,
  xp_for_next_level: 100,
  completed_quests: ["q-ada-1"],
  cards: [unlocked],
  achievements: [],
};

describe("codexCards", () => {
  it("fills in unlocked cards and keeps the rest locked, in world order", () => {
    expect(codexCards(world, progress)).toEqual([
      { id: "c-ada", mentor: "Ada", color: "#e07a5f", card: unlocked },
      { id: "c-karl", mentor: "Karl", color: "#3d5a80", card: null },
    ]);
  });

  it("locks every card for a new player", () => {
    const fresh = { ...progress, cards: [], completed_quests: [] };
    expect(codexCards(world, fresh).every((c) => c.card === null)).toBe(true);
  });
});
