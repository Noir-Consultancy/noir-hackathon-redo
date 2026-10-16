import { describe, expect, it } from "vitest";
import { markerFor } from "./markers";

describe("markerFor", () => {
  it("shows ! for an open quest and ✓ for a completed one", () => {
    expect(markerFor("q-ada-1", [])).toBe("quest");
    expect(markerFor("q-ada-1", ["q-karl-1", "q-ada-1"])).toBe("done");
  });
});
