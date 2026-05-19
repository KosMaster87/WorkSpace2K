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
- [x] Auth Interceptor (JWT automatisch in HTTP-Header)
- [x] Lazy-loaded Routes: Dashboard, Services, Settings, Users
- [x] Login-Page (Dev-Login für Entwicklung)
- [x] `@workspace2k/shared` TypeScript-Types eingebunden

### Shared Package

- [x] `User`, `UserRole` Interface
- [x] `DockerService`, `ServiceStatus` Interface
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

### Docker

- [x] `docker-compose.yml` (Frontend + Backend + PostgreSQL)
- [x] `docker-compose.dev.yml` (nur PostgreSQL lokal, Port 5433)

### CI/CD & Code-Qualität

- [x] GitHub Actions (3 Jobs: format · frontend · backend)
- [x] Prettier — automatische Formatierung
- [x] ESLint — Lint für Frontend und Backend
- [x] Husky + lint-staged — Pre-commit Hook (Prettier)
- [x] `packages/scss-library/` — @dev2k/scss-library im Monorepo

---

## In Arbeit 🔧

### Frontend — Login verbinden

- [ ] `restoreSession` in `app.ts` aktivieren (Backend läuft lokal)
- [ ] Login-Page auf echte API umstellen (aktuell: Dev-Login)
- [ ] Ersten Admin-User per Seed-Script anlegen

---

## Geplant 📋

### Backend — Features

- [ ] Docker API Integration (`/api/docker/containers`)
- [ ] Service-Status API (RAM, CPU, Status)
- [ ] User Management API (CRUD)
- [ ] Settings API

### Frontend — Pages

- [ ] Dashboard: Service-Kacheln mit Live-Status
- [ ] Services-Page: Container starten/stoppen
- [ ] Users-Page: Benutzer verwalten (Admin)
- [ ] Settings-Page: App-Konfiguration

### Infrastructure

- [ ] Dockerfiles für Frontend + Backend
- [ ] NPM Proxy Host Konfiguration
- [ ] Home-Server Deploy (alter PC, Debian)

### PWA

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
