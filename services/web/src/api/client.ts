// API client (owner: package 2). Calls go to /api, proxied to the api service.
import type { AttemptResult, ChatReply, Progress, World } from "./types";

const BASE = import.meta.env.VITE_API_BASE ?? "/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) throw new Error(`${init?.method ?? "GET"} ${path} failed: ${res.status}`);
  return (await res.json()) as T;
}

const post = <T>(path: string, body: unknown) =>
  request<T>(path, { method: "POST", body: JSON.stringify(body) });

export const getWorld = () => request<World>("/world");

export const createPlayer = (name: string) => post<Progress>("/players", { name });

export const getProgress = (playerId: string) => request<Progress>(`/players/${playerId}`);

export const chat = (npcId: string, playerId: string, message: string) =>
  post<ChatReply>(`/npcs/${npcId}/chat`, { player_id: playerId, message });

export const attemptQuest = (questId: string, playerId: string, answer: string) =>
  post<AttemptResult>(`/quests/${questId}/attempt`, { player_id: playerId, answer });
