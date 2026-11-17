// Saved games on this device (owner: package 2): the current player and the recent ones.
// Progress itself lives on the server; here we only remember who played in this browser.

export interface Save {
  player_id: string;
  name: string;
}

const CURRENT_KEY = "kunskapsriket.playerId";
const SAVES_KEY = "kunskapsriket.saves";
export const MAX_SAVES = 8;

/** Puts `save` first, without duplicates, keeping at most `max` saves. */
export function rememberSave(saves: Save[], save: Save, max = MAX_SAVES): Save[] {
  return [save, ...saves.filter((s) => s.player_id !== save.player_id)].slice(0, max);
}

export function forgetSave(saves: Save[], playerId: string): Save[] {
  return saves.filter((s) => s.player_id !== playerId);
}

/** Saves from storage; anything malformed is ignored. */
export function parseSaves(raw: string | null): Save[] {
  try {
    const data: unknown = JSON.parse(raw ?? "[]");
    if (!Array.isArray(data)) return [];
    return data.filter(
      (s): s is Save => typeof s?.player_id === "string" && typeof s?.name === "string",
    );
  } catch {
    return [];
  }
}

/** localStorage wrapper. Storage can be unavailable (private mode), so every call is safe. */
export function deviceSaves(storage: () => Storage = () => localStorage) {
  const read = (key: string) => {
    try {
      return storage().getItem(key);
    } catch {
      return null;
    }
  };
  const write = (key: string, value: string | null) => {
    try {
      if (value === null) storage().removeItem(key);
      else storage().setItem(key, value);
    } catch {
      // Storage unavailable: the player just picks or enters the name again next time.
    }
  };
  const list = () => parseSaves(read(SAVES_KEY));
  const store = (saves: Save[]) => write(SAVES_KEY, JSON.stringify(saves));

  return {
    current: () => read(CURRENT_KEY),
    list,
    /** Marks the player as current and most recent. */
    play: (save: Save) => {
      write(CURRENT_KEY, save.player_id);
      store(rememberSave(list(), save));
    },
    /** Back to the start menu next time; the save stays in the list. */
    leave: () => write(CURRENT_KEY, null),
    forget: (playerId: string) => {
      store(forgetSave(list(), playerId));
      if (read(CURRENT_KEY) === playerId) write(CURRENT_KEY, null);
    },
  };
}
