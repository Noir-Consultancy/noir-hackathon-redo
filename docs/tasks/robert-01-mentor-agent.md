# robert-01: LangGraph-mentoragent (#8)

## Mål
Ersätt chattstubben med en riktig LLM-agent per mentor: svarar i mentorns persona och
minns samtalet under sessionen, per spelare och mentor.

## Upplägg
- `create_react_agent` (LangGraph) med `get_chat_model()` från `app/llm.py`.
- Systemprompt från `persona` plus gemensamma regler (korta svar, svenska, håll dig till
  `topics`).
- Tom verktygslista nu; #9 lägger till `get_player_progress`, `offer_quest`, `lookup_card`.
- Minne: `InMemorySaver`, `thread_id = f"{player_id}:{mentor.id}"`. Försvinner vid omstart.
- Tomt meddelande (dialogen öppnas) ger `greeting` direkt, utan LLM-anrop.
- `offered_quest_id` sätts som i stubben (`mentor.quest_id`) tills `offer_quest` finns i #9,
  så att quest-dialogen (#4) fungerar.
- Agenter byggs lat och cachas per mentor.

## Filer
- `services/api/app/npc/__init__.py`: agent, prompt, `chat()`.
- `services/api/tests/test_npc.py`: tester med fejkad chattmodell.
- Ev. `services/api/tests/test_api.py`: fejka modellen så att testet inte kräver Ollama
  (testfil, inte kontrakt).

## Kontrakt
Använder `POST /npcs/{id}/chat` (`ChatRequest`/`ChatReply`) och `get_mentor()` oförändrade.
Inga kontraktsändringar.

## Test
- `uv run pytest`: fejkad modell; kontrollerar persona i systemprompten, att minnet bär
  över mellan anrop i samma tråd men inte mellan spelare, och greeting vid tomt meddelande.
- Manuellt: `uv run uvicorn app.main:app --reload --port 8001` med `qwen3:8b`, chatta med
  Ada via curl eller webben.
