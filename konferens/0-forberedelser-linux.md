<!-- Keep in sync with 0-forberedelser-mac.md: only the install commands differ. -->
# 0. Förberedelser inför konferensen (Linux)

Gör det här **före 16 oktober** så att ditt team kan börja bygga direkt. Använder du
macOS, följ [förberedelserna för macOS](0-forberedelser-mac.md) i stället.

Kommandona utgår från **Ubuntu** (24.04 eller senare). På Fedora använder du `dnf` i
stället för `apt`.

Varje steg länkar till verktygets officiella guide, som gäller om något skiljer sig.
Stöter du på problem, eller är något här oklart eller fungerar inte? Skriv gärna i
`#tech-ai` på Slack så att vi kan åtgärda det.

## Checklista

**Måste**

- [ ] [Konto för kodagent](#1-konto-för-kodagent), till exempel Claude Pro
- [ ] [Kodagenten installerad och inloggad](#2-kodagent)
- [ ] [Git och åtkomst till konferensrepot](#3-git-och-github-åtkomst)

**Rekommenderat**, de flesta team behöver det

- [ ] [Container-runtime](#4-container-runtime) för Kafka och Postgres och för att köra
      hela lösningen med ett kommando
- [ ] [Lokal LLM](#5-lokal-llm) för AI-funktioner utan API-nyckel
- [ ] [Python och ditt huvudspråk](#6-verktyg-för-ditt-språk) så att kodagenten kan köra
      koden direkt på datorn

**Valfritt**

- [ ] [GitHub CLI](#7-github-cli) så att kodagenten kan skapa PR:er åt dig
- [ ] [API-nyckel för molnmodell](#8-api-nyckel-för-molnmodell) om en lokal modell inte
      räcker

Avsluta med [röktestet](#9-röktest). Läs sedan [uppgiften](1-uppgift.md).

---

## Måste

### 1. Konto för kodagent

**Claude Code är standard** i materialet och det vi har testat med.

| Agent | Abonnemang |
|---|---|
| **Claude Code** (rekommenderas) | Claude **Pro** (ca 20 € per månad) räcker. Gratisnivån räcker *inte*. |
| Codex | ChatGPT Plus. |

> [!NOTE]
> - **Ersättning:** företaget ersätter ca 20 € per månad, se
>   [Arbetsredskap](https://sites.google.com/noir.se/info/personal/arbetsredskap).
> - **Moms:** när du köper från ett företag utanför Sverige kan du ange företagets
>   VAT-nummer, så tecknas abonnemanget utan moms. Numret finns i Slack.
> - **Codex** eller en annan agent går också bra, men instruktionerna för dem är inte
>   testade.

### 2. Kodagent

**Claude Code** ([officiell guide](https://code.claude.com/docs/en/setup)):

```bash
curl -fsSL https://claude.ai/install.sh | bash
claude          # logga in via webbläsaren
```

**Codex** ([officiell guide](https://learn.chatgpt.com/docs/codex/cli)):

```bash
curl -fsSL https://chatgpt.com/codex/install.sh | sh
codex           # logga in med ditt ChatGPT-konto
```

### 3. Git och GitHub-åtkomst

Saknar du Git eller en SSH-nyckel mot GitHub installerar du
[Git](https://git-scm.com/downloads/linux) (`sudo apt install git`) och följer GitHubs
guide för [SSH-nycklar](https://docs.github.com/en/authentication/connecting-to-github-with-ssh).

Du behöver också vara med i organisationen `Noir-Consultancy` på GitHub. Kontrollera
det genom att klona konferensrepot:

```bash
git clone git@github.com:Noir-Consultancy/noir-konferens-ht26.git
```

Fungerar det inte, hör av dig i `#tech-ai` på Slack så fixar vi åtkomsten.

---

## Rekommenderat

### 4. Container-runtime

Används för infrastruktur som Kafka och Postgres och för att köra teamets tjänster med
`compose`. Vi rekommenderar **Podman**.

Installera enligt den [officiella guiden](https://podman.io/docs/installation):

```bash
sudo apt install podman podman-compose
```

> [!NOTE]
> Har du redan **Docker** går det också bra, se den
> [officiella guiden](https://docs.docker.com/engine/install/).
> [Rancher Desktop](https://docs.rancherdesktop.io/getting-started/installation) fungerar
> också, med motorn *dockerd (moby)*, som är standard.

### 5. Lokal LLM

För team som vill bygga AI-funktioner. Exemplen utgår från **Ollama**, installerat
direkt på datorn så att modellen kan använda GPU:n
([officiell guide](https://ollama.com/download/linux)):

```bash
curl -fsSL https://ollama.com/install.sh | sh
ollama pull qwen3.5:9b      # språkmodell, ca 7 GB
ollama pull bge-m3          # embeddings för semantisk sökning, ca 1,2 GB
```

Modellerna är stora, så ladda gärna ner dem i förväg.

> [!TIP]
> Har du lite minne, eller 32 GB eller mer, kan en mindre eller större modell passa
> bättre. Förslag och andra verktyg än Ollama finns i
> [tekniklistan](2-teknik.md#lokala-modeller).

### 6. Verktyg för ditt språk

Kodagenten jobbar snabbare när den kan köra koden direkt på datorn. Installera
**Python (uv)** och **ditt huvudspråk**. Övriga verktyg kan installeras på plats när
teamet har valt teknik.

| Språk | Verktyg | Installation |
|---|---|---|
| Python | [uv](https://docs.astral.sh/uv/getting-started/installation/) | `curl -LsSf https://astral.sh/uv/install.sh \| sh` |
| JS/TS | [fnm](https://github.com/Schniz/fnm#installation) och Node LTS (eller [nvm](https://github.com/nvm-sh/nvm#installing-and-updating)) | `curl -fsSL https://fnm.vercel.app/install \| bash`, öppna en ny terminal och kör `fnm install --lts` |
| Java/Kotlin | [SDKMAN!](https://sdkman.io/install/) | `curl -s "https://get.sdkman.io" \| bash`, öppna en ny terminal och kör `sdk install java` |
| C#/.NET | [.NET SDK](https://learn.microsoft.com/dotnet/core/install/linux) | Följ Microsofts guide för din distribution |

---

## Valfritt

### 7. GitHub CLI

Med GitHub CLI (`gh`) kan kodagenten skapa PR:er, lägga till granskare och läsa
kommentarer åt dig, till exempel via `create-pr`-skillen. Utan den gör du det i stället
på github.com.

Installera från GitHubs eget paketförråd enligt den
[officiella Linux-guiden](https://github.com/cli/cli/blob/trunk/docs/install_linux.md),
eftersom distributionernas paket ofta är för gamla. Logga sedan in:

```bash
gh auth login        # GitHub.com, SSH, logga in via webbläsaren
```

### 8. API-nyckel för molnmodell

Om en lokal modell inte räcker:

- **Gemini (gratis):** skapa en nyckel i [Google AI Studio](https://aistudio.google.com).
- **Anthropic eller OpenAI:** egen nyckel som betalas per användning. Den ingår inte i
  chattabonnemangen.

Nycklar läggs i `.env`, som aldrig checkas in, se [`.env.example`](../.env.example).

> [!WARNING]
> Google kan använda data som skickas till Geminis gratisnivå. Skicka bara påhittad
> data.

---

## 9. Röktest

Kör i mappen där du klonade konferensrepot:

```bash
cd noir-konferens-ht26
claude "Sammanfatta kort vad det här repot innehåller"
podman run --rm quay.io/podman/hello            # om du installerat Podman
curl -s http://localhost:11434/v1/models        # om du installerat Ollama
gh auth status                                  # om du installerat GitHub CLI
```

Fungerar det är du redo!
