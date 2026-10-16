// Types mirroring docs/contract/openapi.yaml.

export interface Point {
  x: number;
  y: number;
}

export interface Rect extends Point {
  w: number;
  h: number;
}

export interface Zone {
  id: string;
  name: string;
  topic: string;
  bounds: Rect;
  color: string;
}

export interface Mentor {
  id: string;
  name: string;
  title: string;
  zone_id: string;
  position: Point;
  color: string;
  quest_id: string;
}

export interface Quest {
  id: string;
  mentor_id: string;
  title: string;
  task: string;
  kind: "explain" | "solve" | "choose";
  xp: number;
  card_id: string;
}

export interface CardSummary {
  id: string;
  title: string;
  mentor_id: string;
}

export interface Card extends CardSummary {
  summary: string;
  when_to_use: string;
  pitfalls: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
}

export interface World {
  zones: Zone[];
  mentors: Mentor[];
  quests: Quest[];
  cards: CardSummary[];
  achievements: Achievement[];
}

export interface Progress {
  player_id: string;
  name: string;
  xp: number;
  level: number;
  xp_for_next_level: number;
  completed_quests: string[];
  cards: Card[];
  achievements: Achievement[];
}

export interface ChatReply {
  reply: string;
  offered_quest_id: string | null;
}

export interface AttemptResult {
  passed: boolean;
  feedback: string;
  xp_awarded: number;
  new_card: Card | null;
  new_achievements: Achievement[];
  progress: Progress;
}
