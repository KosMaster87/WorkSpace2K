# 01 — Projekt-Plan & Roadmap

## Was ist WorkSpace2K?

Ein selbst-gehostetes Management-Portal für den Homelab.
Ziel: alle laufenden Docker-Services zentral verwalten, überwachen und steuern —
mit eigener Benutzeroberfläche statt fremder Cloud-Lösung.

## Ziel-Architektur

```
Browser
  ↓ HTTPS (via NPM / Caddy)
WorkSpace2K Frontend (Angular 21)
  ↓ REST API
WorkSpace2K Backend (Express + TypeScript)
  ├── PostgreSQL (Datenbank)
  └── Docker Socket (Container-Management)
```

## Hardware & Umgebungen

| Umgebung        | OS                                   | Status  |
| --------------- | ------------------------------------ | ------- |
| **Entwicklung** | Fedora 44 KDE (Laptop)               | aktiv   |
| **Home-Server** | Debian (alter PC)                    | geplant |
| **VPS**         | Ubuntu / Debian (IONOS oder Hetzner) | geplant |

---

## Status — Was ist fertig ✅

### Projekt-Setup

- [x] Monorepo-Struktur (`workspace2k-app/`)
- [x] Git-Repo auf GitHub (KosMaster87/WorkSpace2K)
- [x] VS Code Workspace (`workspace2k.code-workspace`)
- [x] `.prettierrc` — Root-Konfiguration für das gesamte Monorepo
- [x] `.husky/pre-commit` + `lint-staged` konfiguriert

### Frontend (Angular 21)

- [x] Angular 21 + NgRx 19 + @ngrx/signals installiert
- [x] @dev2k/scss-library eingebunden (eigene Design-Library)
- [x] Dark Mode mit CSS Custom Properties
- [x] App-Shell: Sidebar + Header + RouterOutlet
- [x] NgRx Auth Store (Actions, Reducer, Selectors, Effects)
- [x] NgRx Signal Store (AppStore — Theme, Sidebar, PageTitle)
- [x] Functional Guards: `authGuard`, `guestGuard`, `adminGuard`
- [x] Auth Interceptor (JWT automatisch in HTTP-Header, localStorage-Fallback)
- [x] Session Restore nach Seiten-Refresh (`isResolved` Flag, Guards warten)
- [x] Lazy-loaded Routes: Dashboard, Services, Settings, Users
- [x] Login-Page
- [x] `@workspace2k/shared` TypeScript-Types eingebunden (rootDir fix)
- [x] Dashboard — Service-Kacheln mit Live-Status (running/stopped)
- [x] Dashboard — Stats-Kacheln (CPU %, RAM, Uptime) für laufende Container
- [x] Services-Page — Container-Liste mit Start/Stop-Buttons + Pending-State
- [x] NgRx Docker Store (Actions, Reducer, Selectors, Effects, State)

### Shared Package (`@workspace2k/shared`)

- [x] `User`, `UserRole` Interface
- [x] `DockerService`, `ServiceStatus` Interface
- [x] `ContainerStats` Interface (CPU, RAM, Uptime)
- [x] `ApiResponse<T>`, `ApiError`, `PaginatedResponse<T>`

### Backend (Express + TypeScript)

- [x] Express + TypeScript + ts-node-dev Setup
- [x] Prisma ORM v5 + PostgreSQL 17
- [x] User-Model + Migration (Rollen: ADMIN, USER)
- [x] `POST /api/auth/login` (JWT, bcrypt)
- [x] `GET /api/auth/me` (Session restore via Token)
- [x] Auth Middleware (JWT-Prüfung)
- [x] `GET /api/health` (Health-Check Endpoint)
- [x] Helmet + CORS konfiguriert
- [x] `GET /api/docker/containers` — Container-Liste (laufend + gestoppt)
- [x] `GET /api/docker/containers/:id/stats` — CPU, RAM, Uptime
- [x] `POST /api/docker/containers/:id/start` — Container starten
- [x] `POST /api/docker/containers/:id/stop` — Container stoppen
- [x] rootDir fix — `@workspace2k/shared` in Backend importierbar
- [x] `GET /api/users` — Alle User auflisten (Admin)
- [x] `POST /api/users` — Neuen User anlegen (Admin)
- [x] `PATCH /api/users/:id/role` — Rolle ändern (Admin)
- [x] `DELETE /api/users/:id` — User löschen (Admin)

### Frontend (weitere Features)

- [x] Users-Page — Tabelle, User anlegen, Rolle ändern, User löschen (mit Bestätigung)
- [x] Settings-Page — Theme-Toggle, Sidebar-Toggle, App-Info
- [x] Sidebar — Menüpunkt „Docker" (Route `/docker`) löst „Services" ab
- [x] Theme Dark — weniger schwarz, tiefes Indigo-Blau
- [x] Theme Light — Indigo-Töne, höherer Kontrast/Sättigung
- [x] Destinations-Page — Kachel-Grid, Kategorien, Admin-CRUD
- [x] Docker Phase 1 — Container löschen + Logs anzeigen (tail 100)
- [x] Docker Phase 2 — Stack-Awareness (Container nach Compose-Projekt gruppiert)
- [x] Docker Phase 2 — Stacks-Ansicht + Flat-Ansicht (View-Toggle in Settings)
- [x] Docker Phase 2 — Stack starten / stoppen
- [x] Settings — Docker-Ansicht-Präferenz in localStorage gespeichert (`ws2k_docker_view`)

### Docker

- [x] `docker-compose.yml` (Frontend + Backend + PostgreSQL)
- [x] `docker-compose.dev.yml` (nur PostgreSQL lokal, Port 5433)

### CI/CD & Code-Qualität

- [x] GitHub Actions — 3 getrennte Workflows (format / frontend / backend)
- [x] Prettier — automatische Formatierung
- [x] ESLint — Lint für Frontend und Backend
- [x] Husky + lint-staged — Pre-commit Hook (Prettier)
- [x] Husky pre-push Hook — Tests laufen automatisch vor jedem Push
- [x] Branch Protection Rules — main gesperrt ohne grüne CI
- [x] `packages/scss-library/` — @dev2k/scss-library im Monorepo
- [x] Unit Tests Frontend — 13 Suites / 126 Tests (Vitest)
- [x] Unit Tests Backend — 3 Suites / 25 Tests (Jest)

### Infrastructure — Dockerfiles

- [x] Dockerfile Frontend (nginx, multi-stage build) — `apps/frontend/Dockerfile`
- [x] Dockerfile Backend (node, multi-stage build) — `apps/backend/Dockerfile`
- [x] `apps/frontend/nginx.conf` (SPA-Routing + /api/ Proxy)
- [x] `docker-compose.yml` — Build-Context auf Monorepo-Root gesetzt
- [x] `docker/.env.example` — Produktions-Variablen (JWT, DB, CORS)
- [x] `.dockerignore` — node_modules, dist, .env ausschließen
- [x] `tsc-alias` — Path-Alias-Rewriting für Backend-Build

---

## In Arbeit 🔧

### Docker — Roadmap (Phasen 3–4)

- [ ] **Phase 3** — Filesystem-Scan für `/opt/stacks/`
- [ ] **Phase 3** — Compose-File-Editor (Stack deployen/bearbeiten)
- [ ] **Phase 3** — Stack updaten (pull + redeploy)
- [ ] **Phase 3** — Live-Logs via WebSocket/SSE
- [ ] **Phase 4** — Multi-Host Docker-Management (remote via Agent)
- [ ] **Phase 4** — Template-System (häufige Services per Klick deployen)

### Infrastructure — Deploy

- [ ] NPM Proxy Host Konfiguration
- [ ] Home-Server Deploy (alter PC)

---

## Geplant 📋

### Home-Server Setup (geplant)

Ziel: WorkSpace2K läuft auf dem Home-Server und verwaltet alle Docker-Services darauf.

```
Workstation (Browser)
    ↓ HTTPS via NPM
Home-Server (Fedora 44 Server)
├── nginx-proxy-manager   → workspace2k.local oder eigene Domain
├── WorkSpace2K Frontend  → Management-Interface
├── WorkSpace2K Backend   → verbindet sich mit Docker Socket
│   └── /var/run/docker.sock  ← Container-Daten lesen/steuern
├── Vaultwarden, Gitea, n8n, Matrix, ...
└── PostgreSQL (WorkSpace2K DB)
```

### PWA (später)

- [ ] Service Worker aktivieren (`@angular/service-worker`)
- [ ] Offline-Support
- [ ] App installierbar

---

## Tech Stack

| Schicht       | Technologie          | Version |
| ------------- | -------------------- | ------- |
| Frontend      | Angular              | 21      |
| State         | NgRx Store + Signals | 19      |
| Styling       | @dev2k/scss-library  | eigen   |
| Backend       | Express + TypeScript | latest  |
| ORM           | Prisma               | latest  |
| Datenbank     | PostgreSQL           | 17      |
| Auth          | JWT                  | -       |
| Container     | Docker + Compose     | v5      |
| Reverse Proxy | Nginx Proxy Manager  | latest  |
