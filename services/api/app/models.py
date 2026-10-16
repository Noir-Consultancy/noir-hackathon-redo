"""Shared API models. Mirrors docs/contract/openapi.yaml – change only with the team's ok."""

from typing import Literal

from pydantic import BaseModel, Field


class Point(BaseModel):
    x: int
    y: int


class Rect(BaseModel):
    x: int
    y: int
    w: int
    h: int


class Zone(BaseModel):
    id: str
    name: str
    topic: str
    bounds: Rect
    color: str


class Mentor(BaseModel):
    id: str
    name: str
    title: str
    zone_id: str
    position: Point
    color: str
    quest_id: str


class Quest(BaseModel):
    id: str
    mentor_id: str
    title: str
    task: str
    kind: Literal["explain", "solve", "choose"]
    xp: int
    card_id: str


class CardSummary(BaseModel):
    id: str
    title: str
    mentor_id: str


class Card(CardSummary):
    summary: str
    when_to_use: str
    pitfalls: str


class Achievement(BaseModel):
    id: str
    title: str
    description: str


class World(BaseModel):
    zones: list[Zone]
    mentors: list[Mentor]
    quests: list[Quest]
    cards: list[CardSummary]
    achievements: list[Achievement]


class Progress(BaseModel):
    player_id: str
    name: str
    xp: int
    level: int
    xp_for_next_level: int
    completed_quests: list[str]
    cards: list[Card]
    achievements: list[Achievement]


class CreatePlayer(BaseModel):
    name: str = Field(min_length=1, max_length=40)


class ChatRequest(BaseModel):
    player_id: str
    message: str = Field(max_length=2000)


class ChatReply(BaseModel):
    reply: str
    offered_quest_id: str | None


class AttemptRequest(BaseModel):
    player_id: str
    answer: str = Field(min_length=1, max_length=4000)


class AttemptResult(BaseModel):
    passed: bool
    feedback: str
    xp_awarded: int
    new_card: Card | None
    new_achievements: list[Achievement]
    progress: Progress
