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

### Docker

- [x] `docker-compose.yml` (Frontend + Backend + PostgreSQL)
- [x] `docker-compose.dev.yml` (nur PostgreSQL lokal, Port 5433)

### CI/CD & Code-Qualität

- [x] GitHub Actions — 3 getrennte Workflows (format / frontend / backend)
- [x] Prettier — automatische Formatierung
- [x] ESLint — Lint für Frontend und Backend
- [x] Husky + lint-staged — Pre-commit Hook (Prettier)
- [x] Branch Protection Rules — main gesperrt ohne grüne CI
- [x] `packages/scss-library/` — @dev2k/scss-library im Monorepo

---

## In Arbeit 🔧

### User Management

- [ ] Backend: `GET /api/users` — Alle User auflisten (Admin)
- [ ] Backend: `POST /api/users` — Neuen User anlegen (Admin)
- [ ] Backend: `PATCH /api/users/:id/role` — Rolle ändern (Admin)
- [ ] Backend: `DELETE /api/users/:id` — User löschen (Admin)
- [ ] Frontend: Users-Page — Tabelle mit allen Usern
- [ ] Frontend: User anlegen (Formular)
- [ ] Frontend: Rolle ändern
- [ ] Frontend: User löschen (mit Bestätigung)

---

## Geplant 📋

### Settings-Page

- [ ] Frontend: Settings-Page — Theme-Auswahl (Dark/Light), ggf. weitere App-Einstellungen

### Infrastructure — Dockerfiles & Deploy

- [ ] Dockerfile Frontend (nginx, multi-stage build)
- [ ] Dockerfile Backend (node, multi-stage build)
- [ ] `docker-compose.yml` anpassen für Production-Build
- [ ] NPM Proxy Host Konfiguration
- [ ] Home-Server Deploy (alter PC)

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
