# daniel-02: LLM-bedömning med strukturerad output (#12)

## Mål
Spelarens svar på en quest bedöms av LLM:en mot questens `criteria` i stället för stubben
(≥ 5 ord). Svaret är `passed` och kort `feedback` på svenska.

## Angreppssätt
- `judge(quest, answer)` i `app/quests/__init__.py` behåller signaturen, så routern och
  kontraktet är oförändrade.
- `get_chat_model(temperature=0).with_structured_output(Judgement)` från delade `app/llm.py`.
- Prompt: systemmeddelande med roll (granskare i Kunskapsriket), questens `task` och
  `criteria`, regler för feedback; spelarens svar som eget användarmeddelande.
- Feedback: 1–3 meningar på svenska, uppmuntrande, du-tilltal. Vid underkänt: en ledtråd om
  vad som saknas utan att citera kriterierna.
- LLM-fel (nere, timeout, ogiltig output) → `JudgeUnavailable`; routern svarar 503
  "Bedömningen är inte tillgänglig just nu, försök igen." Inget försök räknas.
- Lokalt används `qwen3.5:9b` (endast `.env`). Tänkandet stängs av med Roberts
  `LLM_REASONING_EFFORT=none` (#24/#25) som `get_chat_model()` skickar vidare: ~1,5 s i
  stället för ~20 s per bedömning. Ingen egen variabel.

## Filer
- `services/api/app/quests/__init__.py`, `services/api/app/quests/router.py`
- `services/api/tests/test_quests.py` (ny)
- `services/api/tests/conftest.py`: autouse-fixture som monkeypatchar
  `quests.get_chat_model` med en falsk modell (samma mönster som Roberts `fake_llm`).
  `test_api.py` behöver inte ändras.

## Kontrakt
Inga ändringar i modeller. Ny felkod 503 på `POST /quests/{id}/attempt` – läggs till i
`docs/contract/openapi.yaml` i separat commit och stäms av med Emma (#7).

## Test
- Enhetstester med falsk modell (ingen LLM): godkänt/underkänt mappas rätt, prompten
  innehåller `task`, `criteria` och svaret, LLM-fel ger 503 och inga framsteg.
- Manuellt: compose med `qwen3.5:9b`, ett bra och ett dåligt svar på `q-ada-1`, samt
  Ollama avstängd → 503.
