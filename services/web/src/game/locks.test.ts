import { describe, expect, it } from "vitest";
import type { Zone } from "../api/types";
import { lockedDoors } from "./locks";

const zone = (id: string, required_level: number): Zone => ({
  id,
  name: id,
  topic: "",
  bounds: { x: 0, y: 0, w: 1, h: 1 },
  color: "#000",
  required_level,
});

const zones = [zone("a", 1), zone("b", 1), zone("locked", 2)];
const doors = [
  { x: 1, y: 1 },
  { x: 2, y: 2 },
];
// The first door joins two open zones, the second leads into the locked one.
const doorZones: [number, number][] = [
  [0, 1],
  [0, 2],
];

describe("lockedDoors", () => {
  it("locks only doors that connect to a zone above the player's level", () => {
    expect(lockedDoors(zones, doors, doorZones, 1)).toEqual([
      { cell: { x: 2, y: 2 }, zone: zones[2] },
    ]);
  });

  it("opens them once the level is reached", () => {
    expect(lockedDoors(zones, doors, doorZones, 2)).toEqual([]);
  });
});
