// Where a mentor walks next: a nearby free cell in its zone, reached by a straight L-shaped
// path (first along x, then y) over free cells only, so no pathfinding or wall collision
// is needed. Pure, so testable.
import type { Point, Rect } from "../api/types";
import type { MapData } from "./mapgen";
import { EMPTY } from "./tiles";

const RADIUS = 4; // tiles from the current cell
const DOOR_CLEARANCE = 1; // never stand in or next to a door

/** Waypoints (corner, then target) in tile coordinates, or undefined if nowhere to go. */
export function pickWanderPath(
  map: MapData,
  bounds: Rect,
  from: Point,
  random: () => number = Math.random,
): Point[] | undefined {
  const free = (x: number, y: number) =>
    x >= bounds.x &&
    y >= bounds.y &&
    x < bounds.x + bounds.w &&
    y < bounds.y + bounds.h &&
    map.walls[y]?.[x] === EMPTY &&
    !map.doors.some(
      (d) => Math.abs(d.x - x) <= DOOR_CLEARANCE && Math.abs(d.y - y) <= DOOR_CLEARANCE,
    );
  const clear = (a: Point, b: Point) => {
    const [dx, dy] = [Math.sign(b.x - a.x), Math.sign(b.y - a.y)];
    for (let x = a.x, y = a.y; ; x += dx, y += dy) {
      if (!free(x, y)) return false;
      if (x === b.x && y === b.y) return true;
    }
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
