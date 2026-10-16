# emma-02: Belöningar i HUD (#5)

## Mål
Spelaren ser sin nivå och XP tydligt och märker direkt när hen får ett kort, en
achievement eller går upp en nivå.

## Upplägg
- **HUD (alternativ B):** panel uppe till vänster med nivåbricka ("Nv 2"), namn, XP-bar
  mot `xp_for_next_level` med "50/100" och räknare 🃏 (kort) och 🏅 (badges). XP-baren
  animeras med en CSS-transition.
- **Notiser (alternativ 3):**
  - Nytt kort och ny achievement: toasts uppe till höger som försvinner efter ~4 s och
    staplas.
  - Level up: banner mitt upptill, en i taget.
- Notiserna kommer från en jämförelse mellan föregående och ny `Progress`
  (`rewardEvents(prev, next)`), så de fungerar oavsett vilken del som gav belöningen.
  Ingen notis vid första inladdningen.
- Raden "+50 XP · Nytt kort: …" i questrutan ligger kvar.

## Filer
- `services/web/src/ui/hud.ts` – HUD-panelen och `rewardEvents`.
- `services/web/src/ui/hud.test.ts` – test för `rewardEvents`.
- `services/web/src/ui/notify.ts` – toasts och banner.
- `services/web/src/ui/index.ts` – kopplar in HUD och notiser.
- `services/web/src/ui/ui.css` – stilar.

## Kontrakt
Använder `Progress` från `POST /players`, `GET /players/{id}` och
`POST /quests/{id}/attempt`. Inga ändringar.

## Test
- Manuellt: ny spelare, klara Adas quest → XP-baren fylls, toasts för kort och
  "Första questen!". Level up kräver 100 XP (två quests).
- Kvalitetsgrindar: `npm test && npm run lint && npm run build`.
