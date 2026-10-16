import { describe, expect, it } from "vitest";
import type { Mentor, Zone } from "../api/types";
import { buildMap, reachable } from "./mapgen";
import { EMPTY, WALL } from "./tiles";

// Same layout as data/world/zones.yaml and mentors.yaml.
const zone = (id: string, x: number, y: number, w: number, h: number): Zone => ({
  id,
  name: id,
  topic: "",
  bounds: { x, y, w, h },
  color: "#000",
});
const mentor = (id: string, x: number, y: number): Mentor => ({
  id,
  name: id,
  title: "",
  zone_id: "",
  position: { x, y },
  color: "#000",
  quest_id: "",
});

const zones = [zone("a", 0, 0, 20, 15), zone("b", 20, 0, 20, 15), zone("c", 0, 15, 40, 15)];
const mentors = [mentor("ada", 8, 6), mentor("karl", 30, 5), mentor("vera", 12, 22)];
const map = buildMap(zones, mentors);

describe("buildMap", () => {
  it("sizes the map from the zones", () => {
    expect([map.width, map.height]).toEqual([40, 30]);
  });

  it("walls the outer edge", () => {
    for (let x = 0; x < map.width; x++) {
      expect(map.walls[0][x]).not.toBe(EMPTY);
      expect(map.walls[map.height - 1][x]).not.toBe(EMPTY);
    }
    for (let y = 0; y < map.height; y++) {
      expect(map.walls[y][0]).not.toBe(EMPTY);
      expect(map.walls[y][map.width - 1]).not.toBe(EMPTY);
    }
  });

  it("walls zone borders except for doors", () => {
    expect(map.walls[3][19]).not.toBe(EMPTY); // between a and b
    expect(map.walls[14][3]).not.toBe(EMPTY); // between a and c
    expect(map.doors.length).toBe(3 * 3); // a|b, a|c, b|c, three tiles each
    for (const d of map.doors) expect(map.walls[d.y][d.x]).toBe(EMPTY);
  });

  it("keeps spawn and mentors free and reachable", () => {
    expect(map.walls[map.spawn.y][map.spawn.x]).toBe(EMPTY);
    for (const m of mentors) {
      expect(map.walls[m.position.y][m.position.x]).toBe(EMPTY);
      expect(reachable(map.walls, map.spawn, m.position)).toBe(true);
    }
  });

  it("places some obstacles", () => {
    const obstacles = map.walls.flat().filter((t) => t !== EMPTY && t !== WALL);
    expect(obstacles.length).toBeGreaterThan(10);
  });
});
