# Compose-snuttar

Färdig infrastruktur att bygga vidare på. Varje fil fungerar fristående och kan också
kombineras till teamets `compose.yaml` i repots rot. Kickoff-skillen kan göra det åt er
utifrån vad ni behöver.

| Fil | Innehåll | Portar på datorn |
|---|---|---|
| [`kafka.yaml`](kafka.yaml) | Kafka 4 (KRaft, en nod) och [Kafka UI](https://github.com/kafbat/kafka-ui) | `9092` (Kafka), `8081` (UI) |
| [`postgres.yaml`](postgres.yaml) | PostgreSQL 18 med pgvector | `5432` |
| [`ollama.yaml`](ollama.yaml) | *Valfri:* Ollama i container. Vi rekommenderar att köra Ollama direkt på datorn, oavsett operativsystem | `11435` (krockar inte med lokal Ollama) |

## Prova en snutt

```bash
podman compose -f starter/compose/kafka.yaml up -d
podman compose -f starter/compose/kafka.yaml ps        # vänta tills kafka är "healthy"
podman compose -f starter/compose/kafka.yaml down      # lägg till -v för att radera data
```

Med Docker: byt `podman compose` mot `docker compose`.

## Adresser: från datorn eller från en container?

Samma tjänst nås på olika adresser beroende på var koden körs:

| Tjänst | Kod som körs direkt på datorn | Kod som körs i en container i samma compose |
|---|---|---|
| Kafka | `localhost:9092` | `kafka:19092` |
| Postgres | `postgresql://app:app@localhost:5432/app` | `postgresql://app:app@postgres:5432/app` |
| Ollama (container) | `http://localhost:11435/v1` | `http://ollama:11434/v1` |
| Ollama (direkt på datorn, rekommenderat) | `http://localhost:11434/v1` | `http://host.containers.internal:11434/v1` (Podman) / `http://host.docker.internal:11434/v1` (Docker) |

Lägg adresserna i `.env` och läs dem från miljön i koden. Då fungerar samma kod på båda
sätten.

## Kombinera till `compose.yaml`

En `compose.yaml` i repots rot byggs genom att kopiera in de `services:` och `volumes:`
som behövs och lägga till teamets egna tjänster:

```yaml
services:
  # ... kopierat från starter/compose/kafka.yaml och postgres.yaml ...

  matcher:
    build: ./services/matcher
    env_file: .env
    environment:
      KAFKA_BOOTSTRAP_SERVERS: kafka:19092
      DATABASE_URL: postgresql://app:app@postgres:5432/app
    ports:
      - "8000:8000"
    depends_on:
      kafka:
        condition: service_healthy
      postgres:
        condition: service_healthy
```

Vi använder medvetet **inte** `include:`, eftersom den inte stöds av alla versioner av
`podman-compose`.

## Podman-tips

- Images anges med fullständigt namn (`docker.io/...`) så att Podman inte frågar vilket
  register som avses.
- Startar inget? Kontrollera att Podman-maskinen är igång: `podman machine start` (macOS).
- Krockar en port med något du redan kör lokalt, till exempel en egen Postgres? Ändra den
  vänstra siffran i `ports`, till exempel `"5433:5432"`.
