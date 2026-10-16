import { describe, expect, it } from "vitest";
import { directionFor, mentorFrame, playerFrames } from "./sprites";

describe("playerFrames", () => {
  it("maps each direction to its row in player.png", () => {
    expect(playerFrames("down")).toEqual({ idle: 0, walk: [1, 0, 2, 0] });
    expect(playerFrames("up")).toEqual({ idle: 9, walk: [10, 9, 11, 9] });
  });
});

describe("directionFor", () => {
  it("follows the velocity and prefers horizontal on diagonals", () => {
    expect(directionFor(0, -1, "down")).toBe("up");
    expect(directionFor(-1, 1, "down")).toBe("left");
  });

  it("keeps the previous direction when standing still", () => {
    expect(directionFor(0, 0, "right")).toBe("right");
  });
});

describe("mentorFrame", () => {
  it("uses the chosen character for known mentors", () => {
    expect(mentorFrame("karl")).toBe(84);
  });

  it("gives unknown mentors a stable fallback character", () => {
    expect(mentorFrame("ny-mentor")).toBe(mentorFrame("ny-mentor"));
    expect(typeof mentorFrame("ny-mentor")).toBe("number");
  });
});
