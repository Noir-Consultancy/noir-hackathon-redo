# 2. Tekniklista

Välj det som teamet vill lära sig. Ni behöver inte använda allt, och andra språk och
ramverk är också välkomna. **Tröskeln** anger hur lätt det är att komma igång: *låg*,
*medel* eller *hög* (överkurs).

Det enda som alla använder är kodagenter, och de beskrivs i
[kodagenter: begrepp och verktyg](4-kodagenter.md). Allt nedan är valfritt. Varje område
beskriver kort **vad det är**, **typiska användningsfall**, **för- och nackdelar** och
**hur man kommer igång**.

| Område | Tröskel |
|---|---|
| [Gen-AI i applikationen](#gen-ai-i-applikationen) | låg |
| [Lokala modeller](#lokala-modeller) | låg |
| [Agentisk AI](#agentisk-ai) | medel |
| [Webbramverk](#webbramverk) | låg |
| [Kafka och eventdriven arkitektur](#kafka-och-eventdriven-arkitektur) | medel |
| [Databaser och vektorsökning](#databaser-och-vektorsökning) | låg–medel |
| [Moln, CI/CD och IaC](#moln-cicd-och-infrastructure-as-code) | hög |

---

## Gen-AI i applikationen

**Tröskel:** låg

Anropa en språkmodell från koden: generera text, sammanfatta, klassificera, extrahera
strukturerad data (JSON) eller chatta.

- **Användningsfall:** extrahera tekniker ur annonser, generera övningar, matcha profiler,
  chattgränssnitt och embeddings för semantisk sökning (RAG).
- **Fördelar:** löser "luddiga" problem som är svåra med vanlig kod.
- **Nackdelar:** icke-deterministiskt, kan hallucinera och ger latens och kostnad. Svaren
  behöver valideras, till exempel med strukturerad output mot ett schema.
- **Kom igång:** programmera mot ett **OpenAI-kompatibelt API** och konfigurera via
  `LLM_BASE_URL`, `LLM_MODEL` och `LLM_API_KEY` (se [`.env.example`](../.env.example)).
  Då kan ni byta mellan lokal modell och moln utan kodändringar. Klientbibliotek finns för
  de flesta språk, till exempel `openai` (Python och JS), Spring AI (Java) och `OpenAI`
  (.NET). Agentramverk har ofta egna inställningar för olika leverantörer, se
  `.env.example`.

```python
from openai import OpenAI
import os

client = OpenAI(base_url=os.environ["LLM_BASE_URL"], api_key=os.environ["LLM_API_KEY"])
resp = client.chat.completions.create(
    model=os.environ["LLM_MODEL"],
    messages=[{"role": "user", "content": "Lista tre tekniker i: 'Vi söker en Python-utvecklare med Kafka-erfarenhet'"}],
)
print(resp.choices[0].message.content)
```

- **CV-värde:** högt. LLM-integration är en av de mest efterfrågade kompetenserna.

## Lokala modeller

**Tröskel:** låg

Kör en språkmodell på den egna datorn i stället för i molnet.

- **Användningsfall:** prototyper utan kostnad, känslig data som inte får lämna datorn och
  arbete utan uppkoppling.
- **Fördelar:** gratis, privat, inga API-nycklar.
- **Nackdelar:** mindre modeller ger sämre kvalitet än de stora molnmodellerna och begränsas
  av datorns minne och GPU.
- **Kom igång:** alla verktyg nedan erbjuder ett OpenAI-kompatibelt API, så välj det som
  passar er dator. Förberedelserna installerar Ollama med `qwen3.5:9b` och `bge-m3`.

| Verktyg | Plattform | Standard-URL (`LLM_BASE_URL`) | Kommentar |
|---|---|---|---|
| [Ollama](https://ollama.com) | macOS, Linux | `http://localhost:11434/v1` | **Utgångspunkt i exemplen.** Enkelt CLI, stort modellbibliotek. |
| [LM Studio](https://lmstudio.ai) | macOS, Linux | `http://localhost:1234/v1` | Grafiskt gränssnitt. Använder MLX på Apple Silicon. |
| [oMLX](https://omlx.ai) | macOS (Apple Silicon) | `http://localhost:8000/v1` | MLX-server optimerad för Apple Silicon, med disk-cache. |
| [llama.cpp](https://github.com/ggml-org/llama.cpp) (`llama-server`) | macOS, Linux | `http://localhost:8080/v1` | Lågnivå och snabbt, mest kontroll. |
| [RamaLama](https://ramalama.ai) | macOS, Linux | se dokumentation | Från Podman-projektet. Kör modeller som containrar. |

Några modeller att börja med i Ollama. Qwen-modellerna nedan förstår text och bild,
stödjer verktygsanrop och *thinking* och klarar många språk, även svenska.

| Modell | Storlek | Passar |
|---|---|---|
| `qwen3.5:4b` | ca 3,5 GB | datorer med lite minne |
| `qwen3.5:9b` | ca 7 GB | de flesta datorer, bra utgångspunkt |
| `qwen3.6:27b` | ca 18 GB | datorer med 32 GB minne eller mer |
| `bge-m3` | ca 1,2 GB | *embeddings* för semantisk sökning, flerspråkig |

> [!TIP]
> Välj modell efter vad ni ska bygga. En agent behöver stöd för verktygsanrop (*tools*)
> och fungerar ofta bättre med *thinking*, och för att tolka bilder krävs *vision*.
> Modellens sida i [Ollamas bibliotek](https://ollama.com/library) visar vad den stödjer.
> Små modeller räcker för prototyper. Större modeller ger ofta betydligt bättre resultat,
> men kräver mer minne och svarar långsammare.

- **CV-värde:** medel till högt. Efterfrågas särskilt där data inte får lämna organisationen.

## Agentisk AI

**Tröskel:** medel

En *agent* låter en språkmodell själv välja och anropa verktyg (funktioner, API:er,
databaser) i flera steg för att nå ett mål. Ramverk hjälper till med verktygsdefinitioner,
minne, orkestrering och flera samarbetande agenter.

- **Användningsfall:** en studiekompis som kör kod för att rätta svar, en agent som söker i
  profiler och sammanställer matchningar, eller loopar som genererar, validerar och
  förbättrar.
- **Fördelar:** kan lösa öppna uppgifter i flera steg. Mycket efterfrågat just nu.
- **Nackdelar:** svårare att förutsäga och felsöka. Fler LLM-anrop ger högre latens och
  kostnad, och det krävs en modell som är bra på verktygsanrop.
- **Kom igång:**

| Ramverk | Språk | Passar när… |
|---|---|---|
| [LangChain / LangGraph](https://docs.langchain.com) | Python, JS/TS | ni vill ha ett stort ekosystem. LangGraph passar för flöden som grafer med tillstånd. |
| [LangChain4j](https://docs.langchain4j.dev) | Java | ni vill bygga agenter i Java, till exempel med Spring Boot eller Quarkus. |
| [Spring AI](https://docs.spring.io/spring-ai/reference/) | Java | ni redan använder Spring Boot och vill ha LLM-anrop, verktyg och RAG på Spring-sättet. |
| [Microsoft Agent Framework](https://learn.microsoft.com/agent-framework/) | .NET, Python | ni bygger i .NET. Efterföljare till Semantic Kernel och AutoGen. |
| [Vercel AI SDK](https://ai-sdk.dev/docs) | TypeScript | ni bygger i TypeScript, gärna med ett webbgränssnitt som strömmar svar. |
| [CrewAI](https://docs.crewai.com) | Python | ni snabbt vill sätta ihop flera agenter med olika roller och uppgifter. |
| [Google ADK](https://google.github.io/adk-docs/) | Python, Java m.fl. | ni vill ha ett strukturerat ramverk med inbyggt dev-UI och utvärdering. |
| [NVIDIA NeMo Agent Toolkit](https://github.com/NVIDIA/NeMo-Agent-Toolkit) | Python | ni vill koppla ihop agenter från olika ramverk och mäta hur de presterar. |

Alla kan använda lokala modeller, till exempel via Ollama eller LiteLLM, eller
molnmodeller.

> [!TIP]
> **MCP** (Model Context Protocol) är också värt att titta på. Det är ett standardiserat
> sätt att exponera verktyg för agenter, även för kodagenter.

- **CV-värde:** mycket högt. "Agentic AI" är bland de hetaste orden i förfrågningar just nu.

## Webbramverk

**Tröskel:** låg

För API:er och webbgränssnitt. Välj det språk teamet vill använda. Kickoff-skillen
utgår från standardvalet.

| Språk | Standardval | Alternativ |
|---|---|---|
| Python | [FastAPI](https://fastapi.tiangolo.com) | [Django](https://www.djangoproject.com), [Flask](https://flask.palletsprojects.com) |
| Java/Kotlin | [Spring Boot](https://spring.io/projects/spring-boot) | [Quarkus](https://quarkus.io), [Micronaut](https://micronaut.io) |
| C#/.NET | [ASP.NET Core minimal API](https://learn.microsoft.com/aspnet/core/fundamentals/minimal-apis) | [ASP.NET Core MVC](https://learn.microsoft.com/aspnet/core/mvc/overview) med controllers, [Blazor](https://learn.microsoft.com/aspnet/core/blazor/) för webbgränssnitt |
| TypeScript (backend) | [Express](https://expressjs.com) | [Fastify](https://fastify.dev), [NestJS](https://nestjs.com) |
| TypeScript (frontend och fullstack) | [React](https://react.dev) | [Next.js](https://nextjs.org) (fullstack React), [Vue](https://vuejs.org), [Svelte](https://svelte.dev) |

- **Kontrakt:** FastAPI, Spring Boot (med springdoc) och ASP.NET Core kan generera en
  OpenAPI-spec från koden, som passar bra som *kontrakt* mellan teammedlemmar.
- **CV-värde:** högt. Webb-API:er är baskunskap, och Python är förstaspråk inom AI och
  data.

## Kafka och eventdriven arkitektur

**Tröskel:** medel

[Apache Kafka](https://kafka.apache.org) är en distribuerad logg där tjänster
*publicerar* och *prenumererar* på händelser (events) i stället för att anropa varandra
direkt. **Event sourcing** innebär att systemets tillstånd byggs upp genom att spela upp
alla händelser.

- **Användningsfall:** dataflöden (till exempel annonser in, tekniker extraheras, statistik
  ut), integration mellan system, realtidsanalys och revisionsspår.
- **Fördelar:** löst kopplade tjänster som kan utvecklas parallellt, vilket passar bra för
  team som delar upp arbetet. Skalbart och robust.
- **Nackdelar:** mer infrastruktur och fler rörliga delar, eventual consistency, och
  svårare att felsöka än ett vanligt API-anrop.
- **Kom igång:** färdig compose-snutt i [`starter/compose/`](https://github.com/Noir-Consultancy/noir-konferens-ht26/tree/main/starter/compose).
  Klientbibliotek: `confluent-kafka` (Python), `kafkajs` (Node), Spring Kafka (Java),
  `Confluent.Kafka` (.NET). Kom gärna överens om eventschemana tidigt, eftersom flera
  delar beror på dem.
- **CV-värde:** högt. Kafka och eventdriven arkitektur efterfrågas återkommande i
  backend- och integrationsuppdrag.

## Databaser och vektorsökning

**Tröskel:** låg–medel

[PostgreSQL](https://www.postgresql.org) är en robust standarddatabas. Med tillägget
[pgvector](https://github.com/pgvector/pgvector) kan den även lagra *embeddings* och göra
semantisk sökning, som är grunden för RAG (Retrieval-Augmented Generation).

- **Användningsfall:** spara profiler, övningar och resultat, och matcha kompetenser
  semantiskt mot förfrågningar.
- **Fördelar:** en databas för både vanlig data och vektorer, och en välkänd teknik.
- **Nackdelar:** RAG kräver eftertanke kring hur text delas upp och vilken
  embedding-modell som används.
- **Kom igång:** compose-snutt i [`starter/compose/`](https://github.com/Noir-Consultancy/noir-konferens-ht26/tree/main/starter/compose). Embeddings
  kan skapas lokalt med Ollama, till exempel `ollama pull bge-m3`, eller direkt i Python
  med [SentenceTransformers](https://www.sbert.net). Många små embedding-modeller är
  främst tränade på engelska, så för svensk text fungerar flerspråkiga modeller som
  `bge-m3` eller `qwen3-embedding` bättre.
- **CV-värde:** Postgres är baskunskap, medan RAG och vektorsökning är högt efterfrågat.

> [!NOTE]
> För en snabb prototyp räcker ibland SQLite eller en JSON-fil.

## Moln, CI/CD och Infrastructure-as-Code

**Tröskel:** hög. Överkurs för team som har en fungerande MVP och vill gå vidare.

- **CI/CD:** [GitHub Actions](https://docs.github.com/actions) som kör tester och bygger
  containrar vid varje PR. Lätt att lägga till och ger direkt nytta för teamet.
- **Infrastructure-as-Code:** [Terraform](https://developer.hashicorp.com/terraform)
  beskriver molnresurser som kod, och [Ansible](https://docs.ansible.com) automatiserar
  konfigurationen av servrar.
- **Fördelar:** repeterbart, granskningsbart och automatiserat.
- **Nackdelar:** tar tid att sätta upp och svårt att visa upp på kort tid.
- **CV-värde:** högt. CI/CD och IaC efterfrågas i nästan alla moderna uppdrag.

> [!NOTE]
> Det är inte säkert att vi har ett gemensamt molnkonto att driftsätta i. Under hackathonet
> räcker det att skriva och validera, till exempel med `terraform plan` eller
> `ansible-playbook --check`.
