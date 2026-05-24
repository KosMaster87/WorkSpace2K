# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Wichtige Regeln

- **Niemals committen oder pushen ohne vorherige Absprache mit dem User.**
- **Niemals Co-Authored-By in Commits eintragen.**

---

## Monorepo-Struktur

```
workspace2k-app/
├── apps/
│   ├── frontend/          Angular 21 — ng serve auf :4200
│   └── backend/           Express API — läuft auf :3000
├── packages/
│   ├── shared/            @workspace2k/shared — TypeScript-Interfaces (User, DockerService, ApiResponse)
│   └── scss-library/      @dev2k/scss-library — Design Tokens & SCSS Mixins
├── docker/
│   ├── docker-compose.dev.yml   nur PostgreSQL lokal (Port 5433)
│   └── docker-compose.yml       vollständiger Stack
└── .github/workflows/ci.yml     3 Jobs: format · frontend · backend
```

## Befehle

### Vom Monorepo-Root (`workspace2k-app/`)

```bash
npm run lint              # ESLint frontend + backend
npm run typecheck         # tsc --noEmit frontend + backend
npm run format            # Prettier (write)
npm run format:check      # Prettier (check, wie in CI)
npm run build:frontend    # ng build --configuration production
npm run build:backend     # tsc
```

### Frontend (`apps/frontend/`)

```bash
ng serve                  # Dev-Server auf http://localhost:4200
npm run build:prod        # Production Build
npm run lint              # ESLint
npm run typecheck         # tsc --noEmit
ng test                   # Unit Tests (Vitest)
```

### Backend (`apps/backend/`)

```bash
npm run dev               # ts-node-dev (hot reload)
npm run build             # tsc → dist/
npm run lint
npm run typecheck
npm run db:migrate        # prisma migrate dev
npm run db:generate       # prisma generate (nach Schema-Änderung)
npm run db:studio         # Prisma Studio GUI
```

### Dev-Datenbank starten

```bash
cd docker && docker compose -f docker-compose.dev.yml up -d
# PostgreSQL auf localhost:5433 (nicht 5432 — Host-Port belegt)
```

### Backend `.env` (apps/backend/.env — nicht in git)

```
DATABASE_URL=postgresql://ws2k:devpassword@localhost:5433/workspace2k_dev
JWT_SECRET=<openssl rand -hex 32>
CORS_ORIGIN=http://localhost:4200
PORT=3000
```

---

## Frontend-Architektur (Angular 21)

### State-Management — zwei Stores

| Store                    | Typ                            | Zuständig für                                                |
| ------------------------ | ------------------------------ | ------------------------------------------------------------ |
| `store/auth/`            | NgRx Store (`@ngrx/store`)     | Auth-State: user, token, isLoading, error — async, DevTools  |
| `store/app/app.store.ts` | Signal Store (`@ngrx/signals`) | UI-State: Theme, Sidebar, PageTitle — sync, kein Boilerplate |

Der `AppStore` ist `providedIn: 'root'` und wird in `app.ts` über `inject()` genutzt.
Auth-Actions folgen dem `createActionGroup`-Pattern: `AuthActions.login`, `AuthActions.loginSuccess` etc.

### Routing & Guards

Alle Feature-Routes sind lazy-loaded (`loadComponent`). Guards:

- `authGuard` — nur eingeloggte User (redirect → `/login`)
- `guestGuard` — nur nicht-eingeloggte (redirect → `/dashboard`)
- `adminGuard` — nur `ADMIN`-Rolle

Die `AppShellComponent` (Sidebar + Header + RouterOutlet) ist der Parent aller geschützten Routen.

### Auth-Flow

`authInterceptor` (functional, `HttpInterceptorFn`) liest das Token aus dem NgRx Store
(`selectToken`) und hängt es automatisch als `Authorization: Bearer <token>` an jeden HTTP-Request.

### Komponenten-Konventionen

- `standalone: true` wird **nicht** geschrieben — ist seit Angular 17+ der Default
- Separate Dateien: `.ts` + `.html` + `.scss` (kein inline `template`/`styles`)
- Naming: `export class Dashboard`, nicht `DashboardComponent` — `component-class-suffix` ESLint-Regel ist deaktiviert

### SCSS

`@use 'abstracts' as *` und `@use 'base'` in `styles.scss` werden via
`angular.json → stylePreprocessorOptions.includePaths → ../../packages/scss-library` aufgelöst.
Tokens und Mixins aus der Library verwenden, kein manuelles CSS schreiben.

---

## Backend-Architektur (Express + TypeScript)

```
src/
├── index.ts              Express-App, Middleware (helmet, cors, json), Routes registrieren
├── routes/auth.routes.ts POST /api/auth/login, GET /api/auth/me
├── controllers/auth.controller.ts
├── middleware/auth.middleware.ts   JWT-Prüfung, erweitert Request um userId/userRole
└── services/prisma.service.ts     PrismaClient Singleton
```

Endpunkte: `POST /api/auth/login`, `GET /api/auth/me`, `GET /api/health`

Prisma v5 — Schema in `prisma/schema.prisma`. Nach Schema-Änderungen immer
`npm run db:migrate` (neue Migration) und `npm run db:generate` (Client neu generieren).

---

## Linting & Formatting

- **Prettier** — läuft lokal beim Commit (Husky → lint-staged, nur geänderte Dateien)
- **ESLint** — läuft **nur im CI** (nicht in lint-staged), weil lint-staged absolute Pfade
  übergibt die mit der Sub-Package-Konfiguration kollidieren
- **`parserOptions.project` ist nicht gesetzt** in `eslint.config.js` — alle Regeln sind
  syntax-only. `tsconfig.json` hat `"files": []` (Project References) und würde type-aware
  ESLint zum Scheitern bringen

### CI (GitHub Actions)

```
format   → prettier --check
frontend → lint + typecheck + ng build --configuration production
backend  → lint + typecheck + tsc
```

Node.js 24, `npm install` (nicht `npm ci`).

---

## JSDoc-Konvention

**Jede Datei beginnt mit einem `@fileoverview`-Block**, dann eine Leerzeile, dann Imports.
Danach vollständiges JSDoc für jede Funktion/Methode/Klasse.

### Datei-Header (jede `.ts`-Datei)

```typescript
/**
 * @fileoverview Kurzer Titel — was diese Datei macht
 * @description Längere Beschreibung: Kontext, Verantwortlichkeiten, Abhängigkeiten.
 * @module ModulName
 */

import { ... } from '...';
```

### Funktionen & Methoden (vollständig)

```typescript
/**
 * Kurzbeschreibung — was die Funktion tut (Imperativ, eine Zeile).
 * @description Detailliertere Erklärung: Warum so implementiert, wichtige Seiteneffekte,
 *   was diese Funktion von anderen unterscheidet.
 * @async                        ← wenn async
 * @function funktionsName
 * @param {TypA} paramName - Beschreibung des Parameters.
 * @param {TypB} [optionalParam] - Optionaler Parameter (eckige Klammern).
 * @returns {Promise<TypC>} Was zurückgegeben wird.
 * @throws {ErrorTyp} Wann dieser Fehler geworfen wird.  ← nur wenn relevant
 * @private                      ← wenn nur intern
 */
```

### Vollständiges Beispiel (Service-Methode)

```typescript
/**
 * @fileoverview Auth Service — Login, Session Restore, Logout
 * @description Kapselt alle HTTP-Aufrufe an die Auth-API.
 *   Gibt Observable<AuthResponse> zurück — Fehler werden im Effect gefangen.
 * @module AuthService
 */

import { HttpClient } from '@angular/common/http';

/**
 * Sendet Login-Anfrage an die API.
 * @description Gibt { user, token } zurück. Der Token wird vom loginSuccessEffect
 *   in localStorage gespeichert und vom authInterceptor automatisch angehängt.
 * @async
 * @function login
 * @param {string} email - E-Mail-Adresse des Users.
 * @param {string} password - Plaintext-Passwort (wird über HTTPS gesendet).
 * @returns {Observable<AuthResponse>} User-Objekt und JWT-Token.
 */
login(email: string, password: string): Observable<AuthResponse> { ... }
```

### Pflicht-Tags je nach Kontext

| Tag | Wann |
| --- | ---- |
| `@fileoverview` | **Immer** — jede Datei |
| `@description` | Immer wenn mehr als eine Zeile nötig |
| `@param` | Jeder Parameter mit `{Typ}` und Beschreibung |
| `@returns` | Jede Funktion die etwas zurückgibt |
| `@async` | Jede async-Funktion |
| `@private` | Methoden die nur intern genutzt werden |
| `@throws` | Wenn Exceptions explizit geworfen werden |
| `@deprecated` | Wenn eine Methode ersetzt werden soll |

---

## Pfad-Konventionen

Alle Pfade in Konfigurationsdateien (tsconfig, angular.json, eslint.config.js) sind
**immer relativ zur jeweiligen Datei** — niemals absolut.

| Syntax      | Bedeutung                              |
| ----------- | -------------------------------------- |
| `./foo`     | `foo` im selben Ordner wie diese Datei |
| `../foo`    | `foo` einen Ordner höher               |
| `../../foo` | `foo` zwei Ordner höher                |

Absolute Pfade (beginnend mit `/`) sind **verboten** — sie brechen auf anderen Rechnern.

### tsconfig-Struktur (Backend)

Das Backend hat drei tsconfig-Dateien mit unterschiedlichen Zwecken:

| Datei                  | Zweck                                                                 |
| ---------------------- | --------------------------------------------------------------------- |
| `tsconfig.json`        | Haupt-Config — nur `src/**/*`, `rootDir: ./src`                       |
| `tsconfig.seed.json`   | Für `npm run db:seed` — schließt `prisma/**/*` ein, `types: ["node"]` |
| `prisma/tsconfig.json` | Für VS Code — damit IDE `seed.ts` korrekt prüft                       |

`"types": ["node"]` bedeutet: Lade **nur** `@types/node` (gibt `process`, `__dirname` etc.).
Ohne diese Angabe lädt TypeScript alle `@types/*`-Pakete automatisch.

---

## tsconfig-Struktur (Frontend)

`tsconfig.json` enthält `"files": []` und nutzt TypeScript Project References:

- `tsconfig.app.json` — inkludiert `src/**/*.ts` (exkl. specs), wird für den Build genutzt
- `tsconfig.spec.json` — für Tests

Pfad-Aliase: `@app/*` → `./src/app/*`, `@env/*` → `./src/environments/*`,
`@workspace2k/shared` → `../../packages/shared/src`.
