// Markers above mentors: "!" while their quest is open, "✓" once it is completed.

export type Marker = "quest" | "done";

export const MARKER_STYLE: Record<Marker, { text: string; color: string }> = {
  quest: { text: "!", color: "#f2e94e" },
  done: { text: "✓", color: "#7fb069" },
};

export function markerFor(questId: string, completedQuests: readonly string[]): Marker {
  return completedQuests.includes(questId) ? "done" : "quest";
}
