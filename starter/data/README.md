# Exempeldata

Påhittad (syntetisk) data som teamen kan använda, anpassa eller bygga vidare på. Alla
personer, kunder och uppdrag är påhittade. Använd filerna direkt härifrån eller kopiera
dem till ert projekt. Behöver ni något annat kan ni låta kodagenten generera mer data i
samma format.

| Mapp | Innehåll | Passar för |
|---|---|---|
| [`profiles/`](profiles/) | Sex konsultprofiler som JSON i `json/`, samma profiler som läsbara CV:n i `md/` och tre av dem som PDF i `pdf/` | Kompetensgap och utvecklingsförslag, personlig studiekompis, övningsgenerator, dokumentimport |
| [`requests/`](requests/) | Sex uppdragsförfrågningar och rollbeskrivningar i olika format (`.md` och `.txt`), på svenska och engelska | Matchning av profiler mot förfrågningar, kompetensgap |
| [`job-ads/job-ads.jsonl`](job-ads/job-ads.jsonl) | 40 korta jobbannonser från juni till oktober 2026, en per rad | Marknadsradar: producent till Kafka, extraktion av tekniker och trender över tid |
| [`skills/taxonomy.json`](skills/taxonomy.json) | Kompetenskategorier och drygt 200 kompetenser, med en nivå av föräldrar (t.ex. `Java 21` under `Java`) | Normalisera kompetenser, gruppera och räkna |

## Profiler

Varje profil har en titel, en kort presentation, kompetenser, uppdrag med roller,
utbildning, certifieringar och språk. Fritext finns på både svenska och engelska
(`{"sv": …, "en": …}`). Personerna har mellan 5 och 20 års erfarenhet, och i varje
presentation står vad personen vill lära sig härnäst.

| Person | Profil |
|---|---|
| Erik Exempelsson | Senior backend i Java och Kotlin med Kafka, 18 år |
| Amira Provsson | Data- och AI-ingenjör i Python på GCP, 7 år |
| Jonas Demovik | Fullstack i TypeScript, React och Next.js, 5 år |
| Karin Mallgren | Lösningsarkitekt inom .NET och Azure, 20 år |
| Petra Plattberg | Plattformsingenjör med Terraform och Kubernetes, 10 år |
| Oskar Testman | Testautomatiserare som börjat testa AI, 12 år |

Formatet liknar datamodellen i NOIRs profilsystem, men är förenklat för att vara lätt att
läsa och använda:

- Kompetenser anges med namn från taxonomin och har sin kategori med.
- Ett uppdrag listar de kompetenser som användes i uppdraget.
- Ordningen i listorna är visningsordningen, och det finns inga id:n.

Antal år per kompetens kan räknas fram från uppdragens datum. CV:na i Markdown och PDF
visar ett exempel på det.

## Förfrågningar och annonser

Förfrågningarna är skrivna som de brukar se ut i verkligheten. Strukturen varierar,
kraven formuleras på olika sätt och vissa tekniker heter något annat än i taxonomin. Det
är en del av utmaningen när man matchar.

Annonserna i `job-ads.jsonl` har fälten `id`, `title`, `company`, `location`, `remote`,
`posted_at`, `lang` och `text`. De innehåller inga färdigt extraherade kompetenser,
eftersom det är det man bygger. Andelen annonser som nämner AI ökar över tid.

## Generera om CV:na

CV:na i Markdown och PDF genereras från JSON-filerna:

```bash
uv run starter/data/scripts/render.py
```
