# daniel-04: Finslipa mentorernas prompter (#10)

Robert äger paketet. Daniel tar uppgiften så att teamet börjar från ett rent läge.

## Mål
Spelaren förstår hur man får mentorns quest och får den när hen ber om den. Mentorerna
svarar kort, i roll och utan påhittade påståenden.

## Flöde
1. Hälsningen slutar med en ledtråd, t.ex. "…eller be mig om en utmaning".
2. Ber spelaren om en quest/utmaning/ett uppdrag erbjuds questen direkt, utan LLM-anrop.
3. Annars kan modellen erbjuda den med `offer_quest`, och reserven gör det på 3:e
   meddelandet (oförändrad).

## Angreppssätt
- `app/npc/__init__.py`: ordmatchning (`quest`, `utmaning`, `uppdrag` med böjningar) före
  agenten. Vid träff används `offer_quest`-verktygets svar som mentorns svar, och
  utbytet sparas i trådens minne (`update_state`) så att samtalet hänger ihop. Gäller
  inte om questen redan erbjudits i tråden eller är klarad.
- `RULES`: högst 3 meningar. "Hitta inte på fakta" generaliseras till att inte hitta på
  något om spelaren heller (det kommer från `get_player_progress`). Kalla `offer_quest`
  när spelaren ber om en utmaning. "Håll dig till dina ämnen" finns redan och fungerade
  i testet, så den behålls.
- `offer_quest` erbjuder bara en gång per tråd (styrs i koden, inte av modellen), och
  regeln säger "aldrig i ditt första svar".
- Standardmodell `qwen3.5:9b` med `LLM_REASONING_EFFORT=none` i `.env.example`,
  `config.py` och api-README (delade filer, egen commit). En större modell, t.ex.
  `qwen3.6:27b` eller en molnmodell, rekommenderas för att spela på riktigt.
- `data/world/mentors.yaml`: ledtråd i varje `greeting`, och personas utan egen
  "Svara kort" (står i `RULES`).

## Filer
- `services/api/app/npc/__init__.py`, `data/world/mentors.yaml`
- `services/api/tests/test_npc.py`

## Kontrakt
Inga ändringar.

## Test
- Enhetstester med falsk modell: ordet ger questen utan LLM-anrop och sparas i minnet,
  inte om den redan erbjudits eller är klarad, ord som "uppgift" eller "drag" ger inget.
- Manuellt (gjort) med `qwen3.5:9b` och `qwen3.6:27b`: tre samtal per mentor. Båda följer
  flödet; 27b erbjuder questen själv oftare, 9b förlitar sig mer på ord och reserv.
