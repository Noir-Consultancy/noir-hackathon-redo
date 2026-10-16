// Builds the tile map from the zones in /world: floors per zone, walls around the edge
// and between zones, a door on every shared border and a few obstacles. Pure, so testable.
import type { Mentor, Point, Zone } from "../api/types";
import { EMPTY, themeFor, WALL } from "./tiles";

export interface MapData {
  width: number;
  height: number;
  ground: number[][]; // [y][x] tile index
  walls: number[][]; // [y][x] tile index, EMPTY = walkable
  spawn: Point; // tile coordinates
  doors: Point[];
}

const DOOR_WIDTH = 3;
const OBSTACLE_RATE = 0.05;
const CLEARANCE = 2; // obstacles keep this many tiles from mentors, doors and spawn

/** Deterministic pseudo-random number in [0, 1) for a cell. */
function noise(x: number, y: number, salt = 0): number {
  let h = (x * 73856093) ^ (y * 19349663) ^ (salt * 83492791);
  h = Math.imul(h ^ (h >>> 13), 0x5bd1e995);
  return ((h ^ (h >>> 15)) >>> 0) / 2 ** 32;
}

const near = (a: Point, b: Point, d: number) =>
  Math.abs(a.x - b.x) <= d && Math.abs(a.y - b.y) <= d;

/** Index of the zone containing tile (x, y), or -1. */
export function zoneIndexAt(zones: Zone[], x: number, y: number): number {
  return zones.findIndex(({ bounds: b }) => x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h);
}

export function buildMap(zones: Zone[], mentors: Mentor[]): MapData {
  if (zones.length === 0) throw new Error("buildMap: the world has no zones");
  const width = Math.max(...zones.map((z) => z.bounds.x + z.bounds.w));
  const height = Math.max(...zones.map((z) => z.bounds.y + z.bounds.h));

  const zoneAt = (x: number, y: number) => zoneIndexAt(zones, x, y);
  const grid = <T>(fill: (x: number, y: number) => T): T[][] =>
    Array.from({ length: height }, (_, y) => Array.from({ length: width }, (_, x) => fill(x, y)));

  const ground = grid((x, y) => {
    const theme = themeFor(Math.max(zoneAt(x, y), 0));
    const variant = noise(x, y, 1) < 0.1 && theme.floorVariants.length > 0;
    return variant
      ? theme.floorVariants[Math.floor(noise(x, y, 2) * theme.floorVariants.length)]
      : theme.floor;
  });

  // Outer edge and cells outside every zone are walls.
  const walls = grid<number>((x, y) =>
    x === 0 || y === 0 || x === width - 1 || y === height - 1 || zoneAt(x, y) < 0 ? WALL : EMPTY,
  );

  // Borders between zones: a cell whose right or lower neighbour is another zone.
  const borders = new Map<string, Point[]>();
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const here = zoneAt(x, y);
      for (const other of [zoneAt(x + 1, y), zoneAt(x, y + 1)]) {
        if (here < 0 || other < 0 || other === here) continue;
        walls[y][x] = WALL;
        const key = [here, other].sort().join("|");
        borders.set(key, [...(borders.get(key) ?? []), { x, y }]);
      }
    }
  }

  // A door in the middle of each shared border.
  const doors: Point[] = [];
  for (const cells of borders.values()) {
    const unique = [...new Map(cells.map((c) => [`${c.x},${c.y}`, c])).values()];
    unique.sort((a, b) => a.x - b.x || a.y - b.y);
    const mid = Math.floor(unique.length / 2);
    const start = Math.max(0, mid - Math.floor(DOOR_WIDTH / 2));
    for (const cell of unique.slice(start, start + DOOR_WIDTH)) {
      walls[cell.y][cell.x] = EMPTY;
      doors.push(cell);
    }
  }

  // Mentors outside the walkable area are skipped rather than crashing the map.
  const inside = (p: Point) => p.x > 0 && p.y > 0 && p.x < width - 1 && p.y < height - 1;
  const mentorCells = mentors.map((m) => m.position).filter(inside);
  for (const m of mentorCells) walls[m.y][m.x] = EMPTY;

  const spawn = findSpawn(zones[0], walls, mentorCells);

  // Obstacles, kept clear of everything the player must reach.
  const keepClear = [...mentorCells, ...doors, spawn];
  const placed: Point[] = [];
  for (let y = 2; y < height - 2; y++) {
    for (let x = 2; x < width - 2; x++) {
      if (walls[y][x] !== EMPTY || noise(x, y) >= OBSTACLE_RATE) continue;
      if (keepClear.some((p) => near(p, { x, y }, CLEARANCE))) continue;
      const { obstacles } = themeFor(zoneAt(x, y));
      walls[y][x] = obstacles[Math.floor(noise(x, y, 3) * obstacles.length)];
      placed.push({ x, y });
    }
  }
  // Safety net if world content changes: never let obstacles cut off a mentor or a zone.
  if (![...mentorCells, ...doors].every((p) => reachable(walls, spawn, p))) {
    for (const p of placed) walls[p.y][p.x] = EMPTY;
  }

  return { width, height, ground, walls, spawn, doors };
}

/** The free cell in the zone closest to its centre, not on a wall or a mentor. */
function findSpawn(zone: Zone, walls: number[][], mentorCells: Point[]): Point {
  const b = zone.bounds;
  const centre = { x: b.x + Math.floor(b.w / 2), y: b.y + Math.floor(b.h / 2) };
  let best: Point | undefined;
  let bestDist = Number.POSITIVE_INFINITY;
  for (let y = b.y; y < b.y + b.h; y++) {
    for (let x = b.x; x < b.x + b.w; x++) {
      if (walls[y]?.[x] !== EMPTY || mentorCells.some((m) => m.x === x && m.y === y)) continue;
      const d = Math.abs(x - centre.x) + Math.abs(y - centre.y);
      if (d < bestDist) {
        best = { x, y };
        bestDist = d;
      }
    }
  }
  if (!best) throw new Error(`buildMap: no free cell for spawn in zone ${zone.id}`);
  return best;
}

/** Whether `to` can be reached from `from` through EMPTY cells (4-way). */
export function reachable(walls: number[][], from: Point, to: Point): boolean {
  const seen = new Set([`${from.x},${from.y}`]);
  const queue = [from];
  while (queue.length > 0) {
    const p = queue.shift() as Point;
    if (p.x === to.x && p.y === to.y) return true;
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const n = { x: p.x + dx, y: p.y + dy };
      const key = `${n.x},${n.y}`;
      if (walls[n.y]?.[n.x] !== EMPTY || seen.has(key)) continue;
      seen.add(key);
      queue.push(n);
    }
  }
  return false;
}
