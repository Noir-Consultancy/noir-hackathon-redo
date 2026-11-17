import { describe, expect, it } from "vitest";
import { deviceSaves, forgetSave, MAX_SAVES, parseSaves, rememberSave } from "./saves";

const emma = { player_id: "1", name: "Emma" };
const test = { player_id: "2", name: "Test" };

/** Minimal in-memory Storage for the tests. */
function memoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (k) => data.get(k) ?? null,
    key: (i) => [...data.keys()][i] ?? null,
    removeItem: (k) => void data.delete(k),
    setItem: (k, v) => void data.set(k, v),
  };
}

describe("rememberSave", () => {
  it("puts the save first without duplicates", () => {
    expect(rememberSave([emma, test], test)).toEqual([test, emma]);
  });

  it("keeps at most MAX_SAVES", () => {
    const many = Array.from({ length: MAX_SAVES }, (_, i) => ({
      player_id: `p${i}`,
      name: `P${i}`,
    }));
    const result = rememberSave(many, emma);
    expect(result).toHaveLength(MAX_SAVES);
    expect(result[0]).toEqual(emma);
  });
});

describe("forgetSave", () => {
  it("removes the player", () => {
    expect(forgetSave([emma, test], "1")).toEqual([test]);
  });
});

describe("parseSaves", () => {
  it("ignores malformed data", () => {
    expect(parseSaves(null)).toEqual([]);
    expect(parseSaves("not json")).toEqual([]);
    expect(parseSaves('{"a":1}')).toEqual([]);
    expect(parseSaves(JSON.stringify([emma, { name: "no id" }, null]))).toEqual([emma]);
  });
});

describe("deviceSaves", () => {
  it("tracks the current player and the recent ones", () => {
    const storage = memoryStorage();
    const saves = deviceSaves(() => storage);
    saves.play(emma);
    saves.play(test);
    expect(saves.current()).toBe("2");
    expect(saves.list()).toEqual([test, emma]);

    saves.leave();
    expect(saves.current()).toBeNull();
    expect(saves.list()).toEqual([test, emma]);

    saves.forget("2");
    expect(saves.list()).toEqual([emma]);
  });

  it("works without storage", () => {
    const saves = deviceSaves(() => {
      throw new Error("blocked");
    });
    saves.play(emma);
    expect(saves.current()).toBeNull();
    expect(saves.list()).toEqual([]);
  });
});
