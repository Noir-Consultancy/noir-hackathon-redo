// Doors into zones the player hasn't reached the level for yet. Pure, so testable.
import type { Point, Zone } from "../api/types";
import { zoneIndexAt } from "./mapgen";

export interface LockedDoor {
  cell: Point;
  zone: Zone;
}

/** Door cells that lead into a zone needing a higher level than `level`. */
export function lockedDoors(zones: Zone[], doors: Point[], level: number): LockedDoor[] {
  const locked: LockedDoor[] = [];
  for (const cell of doors) {
    // A door sits on the border, so the zones on either side are among its neighbours.
    const around = [
      cell,
      { x: cell.x + 1, y: cell.y },
      { x: cell.x - 1, y: cell.y },
      { x: cell.x, y: cell.y + 1 },
      { x: cell.x, y: cell.y - 1 },
    ];
    const blocking = around
      .map((p) => zones[zoneIndexAt(zones, p.x, p.y)])
      .filter((z): z is Zone => z !== undefined && z.required_level > level)
      .sort((a, b) => b.required_level - a.required_level)[0];
    if (blocking) locked.push({ cell, zone: blocking });
  }
  return locked;
}
