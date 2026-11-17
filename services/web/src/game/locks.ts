// Doors into zones the player hasn't reached the level for yet. Pure, so testable.
import type { Point, Zone } from "../api/types";

export interface LockedDoor {
  cell: Point;
  zone: Zone;
}

/**
 * Door cells that lead into a zone needing a higher level than `level`. `doorZones`
 * holds the two zones each door connects (from buildMap), in the same order as `doors`.
 */
export function lockedDoors(
  zones: Zone[],
  doors: Point[],
  doorZones: [number, number][],
  level: number,
): LockedDoor[] {
  const locked: LockedDoor[] = [];
  doors.forEach((cell, i) => {
    const blocking = (doorZones[i] ?? [])
      .map((z) => zones[z])
      .filter((z) => z !== undefined && z.required_level > level)
      .sort((a, b) => b.required_level - a.required_level)[0];
    if (blocking) locked.push({ cell, zone: blocking });
  });
  return locked;
}
