// Where a mentor walks next: a nearby cell in its zone, reached by a straight L-shaped path
// (first along x, then y), so no pathfinding or wall collision is needed. The path only
// crosses open cells (all eight neighbours walkable), so a mentor that stops on the way can
// never block a passage or a door. Pure, so testable.
import type { Point, Rect } from "../api/types";
import type { MapData } from "./mapgen";
import { EMPTY } from "./tiles";

const RADIUS = 4; // tiles from the current cell

/** Waypoints (corner, then target) in tile coordinates, or undefined if nowhere to go. */
export function pickWanderPath(
  map: MapData,
  bounds: Rect,
  from: Point,
  random: () => number = Math.random,
): Point[] | undefined {
  const inZone = (x: number, y: number) =>
    x >= bounds.x && y >= bounds.y && x < bounds.x + bounds.w && y < bounds.y + bounds.h;
  const open = (x: number, y: number) => {
    if (!inZone(x, y)) return false;
    for (let ny = y - 1; ny <= y + 1; ny++) {
      for (let nx = x - 1; nx <= x + 1; nx++) if (map.walls[ny]?.[nx] !== EMPTY) return false;
    }
    return true;
  };
  // Every cell after `a` up to and including `b` (the start cell is where the mentor already is).
  const clear = (a: Point, b: Point) => {
    const [dx, dy] = [Math.sign(b.x - a.x), Math.sign(b.y - a.y)];
    for (let x = a.x, y = a.y; x !== b.x || y !== b.y; ) {
      x += dx;
      y += dy;
      if (!open(x, y)) return false;
    }
    return true;
  };

  const options: Point[][] = [];
  for (let y = from.y - RADIUS; y <= from.y + RADIUS; y++) {
    for (let x = from.x - RADIUS; x <= from.x + RADIUS; x++) {
      if (x === from.x && y === from.y) continue;
      const corner = { x, y: from.y };
      const target = { x, y };
      if (clear(from, corner) && clear(corner, target)) options.push([corner, target]);
    }
  }
  return options.length ? options[Math.floor(random() * options.length)] : undefined;
}
