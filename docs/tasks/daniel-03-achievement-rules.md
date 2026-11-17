# daniel-03: Achievement-regler (#13)

## Mål
Achievements låses upp enligt reglerna i `data/world/achievements.yaml` i stället för den
hårdkodade `first-quest`.

## Angreppssätt
- `app/progress/achievements.py`: `is_earned(rule, player, level)` för regeltyperna
  - `quests_completed {count}`: minst `count` klarade quests.
  - `level_reached {level}`: nivån är nådd.
  - `zone_completed {zone_id}`: alla quests från zonens mentorer är klarade. En zon utan
    quests räknas aldrig som klarad.
  - `cards_collected` (ny): spelaren har alla kort i `cards.yaml`. `all-cards` byter till
    den, eftersom "3 quests" bara råkar stämma med dagens innehåll.
  - Okänd typ ger `ValueError`.
- `complete_quest()` kontrollerar alla ej upplåsta achievements i samma radlås som XP.
- Bara när en quest klaras. Befintliga spelare får missade badges vid nästa quest.

## Filer
- `services/api/app/progress/achievements.py` (ny), `app/progress/__init__.py`
- `data/world/achievements.yaml`
- `services/api/tests/test_achievements.py` (ny), `tests/test_progress.py`

## Kontrakt
Inga ändringar. `rule` är fortfarande bara på servern.

## Test
- Enhetstester per regeltyp, okänd typ, zon utan quests, alla regler i YAML är giltiga,
  inga dubbletter.
- Manuellt i compose: Ada ger `first-quest` och `agentbyns-hjalte`, Karl `level-2`,
  Vera `all-cards`.
