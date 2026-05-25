# 06 — Docker-Management Konzept

Wie professionelle Docker-Verwaltung aufgebaut ist — unabhängig von der aktuellen
Implementierung. Basis für das nächste Redesign des Docker-Bereichs in WorkSpace2K.

---

## Das grundlegende Problem mit "Container verwalten"

Die meisten Anfänger denken Docker-Management = Container starten/stoppen.
Das ist aber nur die unterste Schicht. Professionell denkt man in **Stacks**, nicht in Containern.

### Warum Stacks, nicht Container?

Stell dir vor du hast Vaultwarden laufen. Vaultwarden besteht aus:

- 1 App-Container (`vaultwarden/server`)
- 1 PostgreSQL-Container (Datenbank)
- Beide im selben Docker-Netzwerk

Wenn du jetzt "Vaultwarden stoppen" willst, musst du **beide** Container kennen,
in der richtigen Reihenfolge stoppen, und das Netzwerk dazwischen sauber halten.

Das macht Docker Compose automatisch — du beschreibst den **Zustand**,
nicht die **Befehle**.

```yaml
# vaultwarden/compose.yaml
services:
  vaultwarden:
    image: vaultwarden/server:latest
    volumes:
      - ./data:/data
    environment:
      DATABASE_URL: postgresql://vw:secret@db/vaultwarden
    ports:
      - '8080:80'
    depends_on: [db]

  db:
    image: postgres:16-alpine
    volumes:
      - ./postgres:/var/lib/postgresql/data
    environment:
      POSTGRES_USER: vw
      POSTGRES_PASSWORD: secret
      POSTGRES_DB: vaultwarden
```

Dieses YAML **ist** die Wahrheit. Nicht der laufende Container.

---

## Die drei Schichten von Docker

```
┌─────────────────────────────────────────────────┐
│  Schicht 3: Stacks (Docker Compose)             │
│  "Vaultwarden", "n8n", "Gitea"                  │
│  → mehrere Container + Netzwerke + Volumes      │
├─────────────────────────────────────────────────┤
│  Schicht 2: Container                           │
│  Einzelne laufende Prozesse                     │
│  → starten, stoppen, logs, inspect              │
├─────────────────────────────────────────────────┤
│  Schicht 1: Images                              │
│  Unveränderliche Snapshots                      │
│  → pullen, lokal cachen, löschen               │
└─────────────────────────────────────────────────┘
```

**Professionelles Management beginnt bei Schicht 3.**
Schicht 2 ist nur für Debugging und kurzfristige Eingriffe.

---

## Was die professionellen Tools machen

### Portainer (der Standard)

Portainer ist der de-facto Standard für Self-hosted Docker-Management.

**Was Portainer kann:**

- **Stacks** — Docker Compose Files deployen, bearbeiten, aktualisieren
- **Container** — Start, Stop, Restart, Delete, Logs, Shell (exec)
- **Images** — Pull, Delete, Prune
- **Volumes** — Erstellen, Löschen, Browse
- **Networks** — Erstellen, Löschen
- **Secrets** — Sensitive Werte verschlüsselt speichern
- **Registries** — Private Docker-Registries einbinden
- **Users** — Multi-User mit Rollen und Teams
- **Endpoints** — Mehrere Docker-Hosts verwalten (auch remote via Agent)

**Portainer-Philosophie:** Alles ist ein Stack. Container-Management ist sekundär.

### Dockge (der Newcomer, 2023)

Dockge wurde von Louislam gebaut (derselbe der Uptime Kuma gemacht hat).
Fokus: **Nur** Docker Compose Stacks — nichts anderes.

**Was Dockge kann:**

- Compose-Stacks im Filesystem verwalten (`/opt/stacks/vaultwarden/compose.yaml`)
- Live-Logs pro Stack
- Pull + Redeploy mit einem Klick
- Stack-Status (running, stopped, partial)
- Keine Container-Verwaltung, keine Images, keine Volumes — bewusste Entscheidung

**Dockge-Philosophie:** Du bist DevOps-affin, du kennst Compose-Files.
Das Tool hilft dir sie zu verwalten, nicht zu verstecken.

### Yacht

Wie Portainer aber einfacher, für Einsteiger. Unterstützt Templates (vorgefertigte
App-Configs zum schnellen Deployen). Weniger Features, aber übersichtlicher.

---

## Wie der Homelab typischerweise aufgebaut ist

```
/opt/
└── stacks/
    ├── vaultwarden/
    │   ├── compose.yaml
    │   └── data/           ← Container-Daten (Volume)
    ├── n8n/
    │   ├── compose.yaml
    │   └── data/
    ├── gitea/
    │   ├── compose.yaml
    │   └── data/
    ├── nginx-proxy-manager/
    │   ├── compose.yaml
    │   └── data/
    └── workspace2k/
        ├── compose.yaml
        └── ...
```

Jeder Service hat seinen eigenen Ordner mit `compose.yaml`.
Das ist die **Single Source of Truth** — kein GUI, kein Tool, das diese Wahrheit
überschreibt.

**Update-Workflow:**

```bash
cd /opt/stacks/vaultwarden
docker compose pull        # Neue Image-Version laden
docker compose up -d       # Neu starten mit neuem Image
```

---

## Konzept für WorkSpace2K Docker-Management

### Was WorkSpace2K NICHT bauen sollte

- ❌ Rohen Container-Create-Dialog (zu komplex, falscher Ansatz)
- ❌ Image-Management (außer "Pull", das hat Portainer besser)
- ❌ Volume/Network-Verwaltung (zu low-level)
- ❌ Alles was Portainer schon perfekt macht

WorkSpace2K konkurriert **nicht** mit Portainer. Es ist ein **Homelab-Dashboard**,
kein vollständiges Docker-Management-Tool.

### Was WorkSpace2K bauen SOLLTE

**Primär: Stack-Übersicht**

```
┌─────────────────────────────────────────────────────────────────────┐
│  Docker Stacks                                           [+ Deploy]  │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ ▶ Vaultwarden           ✅ running  2 Container  [Stop] [↓] │   │
│  │   vaultwarden/server:latest, postgres:16                     │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │ ▶ n8n                   ✅ running  1 Container  [Stop] [↓] │   │
│  │   n8nio/n8n:latest                                           │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │ ▶ Gitea                 ⏸ stopped  2 Container [Start] [↓] │   │
│  │   gitea/gitea:latest, postgres:16                            │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

**Sekundär: Container-Details (pro Stack aufklappbar)**

```
▼ Vaultwarden           ✅ running  2 Container  [Stop] [↓]
  ├── vaultwarden  ✅  vaultwarden/server:latest  8080→80  [Logs]
  └── vaultwarden-db ✅  postgres:16              (intern)  [Logs]
```

**[↓] = Update-Button (pull + redeploy)**

### Die drei Kernfunktionen

| Funktion          | Was passiert                                | Wie                              |
| ----------------- | ------------------------------------------- | -------------------------------- |
| **Stack starten** | `docker compose up -d` im Stack-Verzeichnis | Backend ruft Docker Compose API  |
| **Stack stoppen** | `docker compose down`                       | Backend ruft Docker Compose API  |
| **Stack updaten** | `docker compose pull && up -d`              | Pull neuer Images, dann neustart |

### Wie WorkSpace2K Stacks erkennt

**Option A: Filesystem-Scan** (wie Dockge)

- Backend scannt `/opt/stacks/` und findet alle `compose.yaml`-Dateien
- Stack-Name = Ordnername
- Kein manuelles Konfigurieren nötig

**Option B: Datenbank-Registry** (wie Portainer)

- Stacks werden in der WorkSpace2K-DB registriert
- Pfad zum Compose-File wird gespeichert
- Mehr Kontrolle, aber manuelles Einrichten nötig

**Empfehlung für WorkSpace2K:** Option A (Filesystem-Scan) + Option B kombinieren:

- Automatisch alle Stacks aus `/opt/stacks/` erkennen
- Admins können zusätzliche Pfade manuell registrieren

### Stack deployen (neue Services)

Statt eines Container-Create-Dialogs: **Compose-File-Editor**

```
┌─────────────────────────────────────────────────────┐
│  Neuen Stack deployen                               │
│                                                     │
│  Stack-Name: [ uptime-kuma              ]           │
│  Pfad:       [ /opt/stacks/uptime-kuma  ]           │
│                                                     │
│  compose.yaml:                                      │
│  ┌─────────────────────────────────────────────┐   │
│  │ services:                                   │   │
│  │   uptime-kuma:                              │   │
│  │     image: louislam/uptime-kuma:1           │   │
│  │     volumes:                                │   │
│  │       - ./data:/app/data                   │   │
│  │     ports:                                  │   │
│  │       - "3001:3001"                         │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│              [Deploy] [Abbrechen]                   │
└─────────────────────────────────────────────────────┘
```

Das ist **professionell**: Der User arbeitet mit dem echten Compose-Format,
nicht mit einem vereinfachenden Dialog der immer zu wenig kann.

---

## Docker API vs. Docker Compose CLI

Aktuell nutzt WorkSpace2K die **Docker API direkt** (via `dockerode` oder ähnlichem).
Das hat einen Nachteil: Es kennt keine Stacks — nur einzelne Container.

Für Stack-Management gibt es zwei Wege:

### Weg 1: Docker Compose CLI im Backend aufrufen

```typescript
// Backend ruft docker compose Befehle auf
import { exec } from 'child_process';

async function startStack(stackPath: string): Promise<void> {
  await exec(`docker compose -f ${stackPath}/compose.yaml up -d`);
}
```

**Vorteile:** Nutzt echtes Docker Compose, alle Features inklusive
**Nachteile:** `docker compose` CLI muss auf dem Server installiert sein

### Weg 2: Docker Compose via API emulieren

Docker Compose ist letztendlich nur Docker API-Calls mit Labels.
Alle Compose-managed Container bekommen das Label:

```
com.docker.compose.project=vaultwarden
com.docker.compose.service=db
```

WorkSpace2K kann diese Labels nutzen um Container zu Stacks zu gruppieren —
ohne `docker compose` CLI zu brauchen.

**Empfehlung:** Weg 1 (CLI) für volle Kompatibilität, Weg 2 als Fallback.

---

## Logs — ein wichtiges Feature

Ohne Logs ist Docker-Management blind. Professionell:

```
Vaultwarden → vaultwarden Container → [Logs anzeigen]

2026-05-25T14:23:01 [INFO] Starting Vaultwarden server
2026-05-25T14:23:02 [INFO] Listening on 0.0.0.0:80
2026-05-25T14:23:15 [INFO] User login: admin@example.com
```

Backend: `GET /api/docker/containers/:id/logs?tail=100`
Docker API: `container.logs({ stdout: true, stderr: true, tail: 100 })`

Für Live-Logs: WebSocket oder Server-Sent Events (SSE).

---

## Empfohlene Roadmap für WorkSpace2K

### Phase 1 — Bestehend verbessern (kurzfristig)

- ✅ Container-Liste (läuft)
- ✅ Start/Stop
- [ ] Delete (gestoppte Container löschen)
- [ ] Container-Logs anzeigen (tail 100)

### Phase 2 — Stack-Awareness (mittelfristig)

- [ ] Container nach `com.docker.compose.project`-Label gruppieren
- [ ] Stack-Übersicht statt flache Container-Liste
- [ ] Stack stoppen/starten (alle Container des Stacks)

### Phase 3 — Stack-Management (langfristig)

- [ ] Filesystem-Scan für `/opt/stacks/`
- [ ] Compose-File-Editor (neuen Stack deployen/bearbeiten)
- [ ] Stack updaten (pull + redeploy)
- [ ] Live-Logs via WebSocket/SSE

### Phase 4 — Portainer-Alternative (Vision)

- [ ] Multi-Host (remote Docker-Hosts via TCP/SSH)
- [ ] Image-Management (prune, pull)
- [ ] Template-System (häufige Services per Klick deployen)

---

## Fazit

**Kurz:** Docker-Management = Stack-Management, nicht Container-Management.

**Für WorkSpace2K** bedeutet das: Die aktuelle Container-Liste ist ein guter Start
für Phase 1, aber das eigentliche Feature ist die Stack-Übersicht in Phase 2.
Compose-Files sind die Single Source of Truth — WorkSpace2K sollte sie lesen,
anzeigen und editierbar machen, nicht hinter einem Dialog verstecken.

**Referenzen:**

- Dockge: https://github.com/louislam/dockge
- Portainer: https://docs.portainer.io/
- Docker Compose Spec: https://compose-spec.io/
- Docker Engine API: https://docs.docker.com/engine/api/
