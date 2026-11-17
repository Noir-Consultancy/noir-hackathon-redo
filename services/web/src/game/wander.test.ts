import { describe, expect, it } from "vitest";
import type { Point } from "../api/types";
import type { MapData } from "./mapgen";
import { EMPTY, WALL } from "./tiles";
import { pickWanderPath } from "./wander";

// 10×10 map: walls on the edge and a wall column at x = 5 with a door at (5, 5).
function map(): MapData {
  const walls = Array.from({ length: 10 }, (_, y) =>
    Array.from({ length: 10 }, (_, x) =>
      x === 0 || y === 0 || x === 9 || y === 9 || (x === 5 && y !== 5) ? WALL : EMPTY,
    ),
  );
  return {
    width: 10,
    height: 10,
    ground: [],
    walls,
    spawn: { x: 2, y: 2 },
    doors: [{ x: 5, y: 5 }],
  };
}

const bounds = { x: 0, y: 0, w: 5, h: 10 }; // left zone, excluding the wall column
const from = { x: 2, y: 2 };

function allPaths(): Point[][] {
  const paths: Point[][] = [];
  for (let i = 0; i < 200; i++) {
    const path = pickWanderPath(map(), bounds, from, () => i / 200);
    if (path) paths.push(path);
  }
  return paths;
}

describe("pickWanderPath", () => {
  it("only targets free cells in the zone, away from doors", () => {
    const m = map();
    for (const [, target] of allPaths()) {
      expect(m.walls[target.y][target.x]).toBe(EMPTY);
      expect(target.x).toBeLessThan(5);
      expect(Math.abs(target.x - 5) > 1 || Math.abs(target.y - 5) > 1).toBe(true);
      expect(target).not.toEqual(from);
    }
  });

  it("goes along x first, then y", () => {
    for (const [corner, target] of allPaths()) {
      expect(corner).toEqual({ x: target.x, y: from.y });
    }
  });

  it("returns undefined when boxed in", () => {
    const m = map();
    for (const [x, y] of [
      [1, 2],
      [3, 2],
      [2, 1],
      [2, 3],
    ])
      m.walls[y][x] = WALL;
    expect(pickWanderPath(m, bounds, from)).toBeUndefined();
  });
});
