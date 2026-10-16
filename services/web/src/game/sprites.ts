// Character sprites: the NOIR mascot (player) and Kenney Tiny Dungeon (mentors).

export const SPRITE_TILE = 16;

export const PLAYER_KEY = "player";
export const PLAYER_URL = "/assets/player/player.png";

export const CHARACTERS_KEY = "tiny-dungeon";
export const CHARACTERS_URL = "/assets/tiny-dungeon/tilemap_packed.png";

// Rows in player.png, top to bottom. Columns: idle, step A, step B.
export const DIRECTIONS = ["down", "left", "right", "up"] as const;
export type Direction = (typeof DIRECTIONS)[number];

export function playerFrames(dir: Direction): { idle: number; walk: number[] } {
  const row = DIRECTIONS.indexOf(dir) * 3;
  return { idle: row, walk: [row + 1, row, row + 2, row] };
}

/** Facing for a velocity; horizontal wins on diagonals, standing still keeps `previous`. */
export function directionFor(vx: number, vy: number, previous: Direction): Direction {
  if (vx < 0) return "left";
  if (vx > 0) return "right";
  if (vy < 0) return "up";
  if (vy > 0) return "down";
  return previous;
}

// Frames in Tiny Dungeon's tilemap_packed.png (index = row * 12 + column).
const MENTOR_FRAMES: Record<string, number> = {
  ada: 100, // grey-haired veteran
  karl: 84, // wizard in purple
  vera: 111, // scholar in a hood
  mo: 86, // dwarf smith
};
const FALLBACK_FRAMES = [88, 98, 99, 112, 97];

export function mentorFrame(mentorId: string): number {
  if (mentorId in MENTOR_FRAMES) return MENTOR_FRAMES[mentorId];
  const hash = [...mentorId].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 0);
  return FALLBACK_FRAMES[hash % FALLBACK_FRAMES.length];
}
