import type { Point } from "../api/types";

export const TILE = 32;

/** The item closest to `from` within `maxDist` pixels, or undefined. */
export function nearestWithin<T extends { pos: Point }>(
  from: Point,
  items: T[],
  maxDist: number,
): T | undefined {
  let best: T | undefined;
  let bestDist = maxDist;
  for (const item of items) {
    const d = Math.hypot(item.pos.x - from.x, item.pos.y - from.y);
    if (d <= bestDist) {
      best = item;
      bestDist = d;
    }
  }
  return best;
}
