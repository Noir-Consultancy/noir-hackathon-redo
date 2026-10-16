// Tile indices in Kenney Tiny Town (public/assets/tiny-town/tilemap_packed.png,
// 12 columns of 16×16 tiles; index = row * 12 + column).

export const TILESET_KEY = "tiny-town";
export const TILESET_URL = "/assets/tiny-town/tilemap_packed.png";
export const TILESET_TILE = 16;

export const EMPTY = -1;
export const WALL = 126; // grey brick

export interface ZoneTheme {
  floor: number;
  floorVariants: number[]; // sprinkled in for texture, walkable
  obstacles: number[];
}

// One theme per zone, in the order zones come from /world; cycles for more zones.
export const ZONE_THEMES: ZoneTheme[] = [
  { floor: 0, floorVariants: [1, 2], obstacles: [28, 27, 5] }, // grass, trees, bush
  { floor: 109, floorVariants: [], obstacles: [5, 29] }, // light stone, bush, mushrooms
  { floor: 25, floorVariants: [39], obstacles: [27, 5] }, // dirt, autumn tree, bush
];

export const themeFor = (zoneIndex: number): ZoneTheme =>
  ZONE_THEMES[zoneIndex % ZONE_THEMES.length];
