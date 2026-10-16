import { describe, expect, it } from "vitest";
import { nearestWithin } from "./geometry";

describe("nearestWithin", () => {
  const items = [
    { id: "a", pos: { x: 0, y: 0 } },
    { id: "b", pos: { x: 100, y: 0 } },
  ];

  it("returns the closest item within range", () => {
    expect(nearestWithin({ x: 90, y: 0 }, items, 50)?.id).toBe("b");
  });

  it("returns undefined when nothing is in range", () => {
    expect(nearestWithin({ x: 50, y: 300 }, items, 50)).toBeUndefined();
  });
});
