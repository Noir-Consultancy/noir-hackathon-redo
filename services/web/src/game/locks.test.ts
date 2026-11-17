import { describe, expect, it } from "vitest";
import type { Zone } from "../api/types";
import { lockedDoors } from "./locks";

const zone = (id: string, y: number, required_level: number): Zone => ({
  id,
  name: id,
  topic: "",
  bounds: { x: 0, y, w: 10, h: 5 },
  color: "#000",
  required_level,
});

// Two zones stacked vertically; the door is on the last row of the top zone.
const zones = [zone("open", 0, 1), zone("locked", 5, 2)];
const doors = [
  { x: 4, y: 4 },
  { x: 5, y: 4 },
];

describe("lockedDoors", () => {
  it("locks doors into a zone above the player's level", () => {
    expect(lockedDoors(zones, doors, 1)).toEqual([
      { cell: { x: 4, y: 4 }, zone: zones[1] },
      { cell: { x: 5, y: 4 }, zone: zones[1] },
    ]);
  });

  it("opens them once the level is reached", () => {
    expect(lockedDoors(zones, doors, 2)).toEqual([]);
  });
});
