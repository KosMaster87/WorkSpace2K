# 05 — Destinations Feature

Selbst-gehostete Web-Services zentral verwalten und per Klick öffnen.
Statt Browser-Bookmarks pflegt man Destinations in WorkSpace2K — mit Kategorien,
Icons und (Phase 2) automatischem Health-Check.

---

## Was sind Destinations?

Jeder Docker-Service der über einen Browser erreichbar ist, kann als Destination
gespeichert werden: Nginx Proxy Manager, Vaultwarden, n8n, Gitea, GitLab, Element
und beliebig viele weitere.

Ein Klick auf die Kachel öffnet den Service in einem neuen Tab.
Admins können Destinations anlegen, bearbeiten und löschen.

---

## Architektur-Überblick

```
Browser (WorkSpace2K)
  ↓ Klick auf Destination-Kachel
  window.open(url, '_blank')          ← direkt im Browser

Admin-Aktionen (Create / Update / Delete)
  ↓ HTTP
Angular Frontend
  ↓ /api/destinations
Express Backend
  ↓ Prisma
PostgreSQL (destinations-Tabelle)
```

---

## Datenbank — Prisma Schema

```prisma
model Destination {
  id          String   @id @default(cuid())
  name        String                        // "Nginx Proxy Manager"
  url         String                        // "http://localhost:81"
  icon        String?                       // Emoji: "🔀" oder URL zu Favicon
  category    String?                       // "Infrastruktur", "DevOps", "Security"
  description String?                       // "Reverse Proxy für alle Services"
  sortOrder   Int      @default(0)          // Reihenfolge innerhalb der Kategorie
  isActive    Boolean  @default(true)       // false = ausgeblendet aber nicht gelöscht
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("destinations")
}
```

### Migration

```bash
cd apps/backend
npx prisma migrate dev --name add-destination
npx prisma generate
```

### Seed-Daten

Werden beim ersten `npm run db:seed` automatisch angelegt (idempotent):

| Name                | URL                           | Icon | Kategorie     |
| ------------------- | ----------------------------- | ---- | ------------- |
| Nginx Proxy Manager | http://localhost:81           | 🔀   | Infrastruktur |
| Vaultwarden         | https://vaultwarden.localhost | 🔒   | Security      |
| n8n                 | https://n8n.localhost         | ⚙️   | Automation    |
| Gitea               | https://gitea.localhost       | 🐙   | DevOps        |
| GitLab              | https://gitlab.localhost      | 🦊   | DevOps        |
| Element             | https://element.localhost     | 💬   | Kommunikation |

---

## Shared Types (`@workspace2k/shared`)

```typescript
// packages/shared/src/models/destination.model.ts

export interface Destination {
  id: string;
  name: string;
  url: string;
  icon?: string;
  category?: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDestinationPayload {
  name: string;
  url: string;
  icon?: string;
  category?: string;
  description?: string;
  sortOrder?: number;
}

export interface UpdateDestinationPayload {
  name?: string;
  url?: string;
  icon?: string;
  category?: string;
  description?: string;
  sortOrder?: number;
  isActive?: boolean;
}
```

---

## Backend API

### Endpunkte

| Methode  | Endpoint                | Auth       | Beschreibung                   |
| -------- | ----------------------- | ---------- | ------------------------------ |
| `GET`    | `/api/destinations`     | User       | Alle aktiven Destinations      |
| `POST`   | `/api/destinations`     | Admin only | Neue Destination anlegen       |
| `PATCH`  | `/api/destinations/:id` | Admin only | Name/URL/Icon/Kategorie ändern |
| `DELETE` | `/api/destinations/:id` | Admin only | Destination löschen (204)      |

### Auth-Strategie

```
GET    → authMiddleware (alle eingeloggten User)
POST   → authMiddleware + adminOnly
PATCH  → authMiddleware + adminOnly
DELETE → authMiddleware + adminOnly
```

### Antwort-Format

```json
// GET /api/destinations
{
  "data": [
    {
      "id": "clxxxx",
      "name": "Nginx Proxy Manager",
      "url": "http://localhost:81",
      "icon": "🔀",
      "category": "Infrastruktur",
      "description": "Reverse Proxy für alle Services",
      "sortOrder": 0,
      "isActive": true,
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-01-01T00:00:00.000Z"
    }
  ]
}
```

### Dateien

```
apps/backend/src/
├── controllers/destinations.controller.ts   listDestinations, createDestination, updateDestination, deleteDestination
└── routes/destinations.routes.ts            Router, authMiddleware, adminOnly
```

---

## Frontend — NgRx Store

### State

```
store/destinations/
├── destinations.state.ts      DestinationsState + initialDestinationsState
├── destinations.actions.ts    Load / Create / Update / Delete + Success/Failure
├── destinations.reducer.ts    State-Übergänge
├── destinations.selectors.ts  selectAllDestinations, selectDestinationsLoading, ...
└── destinations.effects.ts    Async HTTP via DestinationService
```

### State-Struktur

```typescript
interface DestinationsState {
  destinations: Destination[];
  isLoading: boolean;
  isCreating: boolean;
  pendingIds: string[]; // IDs mit laufendem Update/Delete
  error: string | null;
}
```

### Selektoren

| Selektor                       | Gibt zurück                                        |
| ------------------------------ | -------------------------------------------------- | ----- |
| `selectAllDestinations`        | `Destination[]` — alle (inkl. inaktive für Admins) |
| `selectActiveDestinations`     | `Destination[]` — nur `isActive: true`             |
| `selectDestinationsLoading`    | `boolean`                                          |
| `selectDestinationsCreating`   | `boolean`                                          |
| `selectDestinationsPendingIds` | `string[]`                                         |
| `selectDestinationsError`      | `string                                            | null` |
| `selectGroupedDestinations`    | `{ category: string; items: Destination[] }[]`     |

---

## Frontend — Service

```
apps/frontend/src/app/core/services/destination.service.ts
```

```typescript
getDestinations(): Observable<Destination[]>
createDestination(payload: CreateDestinationPayload): Observable<Destination>
updateDestination(id: string, payload: UpdateDestinationPayload): Observable<Destination>
deleteDestination(id: string): Observable<void>
```

---

## Frontend — Feature-Komponente

```
apps/frontend/src/app/features/destinations/
├── destinations.ts       Logik, Signals, Dispatch
├── destinations.html     Card-Grid, Formular, Admin-Buttons
└── destinations.scss     Layout, Kacheln, Formular
```

### UI-Struktur

```
┌─────────────────────────────────────────────────────────────┐
│  Destinations                            [+ Neue Destination]│
│  Schnellzugriff auf alle Self-hosted Services               │
│                                                             │
│  ── Infrastruktur ─────────────────────────────────────    │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │ 🔀            │  │ 🔒            │                        │
│  │ NPM           │  │ Vaultwarden  │                        │
│  │ localhost:81  │  │ vault.local  │                        │
│  │        ✏ 🗑  │  │        ✏ 🗑  │                        │
│  └──────────────┘  └──────────────┘                        │
│                                                             │
│  ── DevOps ────────────────────────────────────────────    │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │ 🐙            │  │ 🦊            │                        │
│  │ Gitea        │  │ GitLab       │                        │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

- Klick auf Kachel → `window.open(url, '_blank')`
- ✏ Edit-Button → Inline-Edit-Formular klappt auf
- 🗑 Delete-Button → Bestätigungs-Step (gleiche Logik wie Users-Page)
- Admin-Buttons nur sichtbar wenn `user.role === 'admin'`

### Routing

```typescript
// app.routes.ts
{
  path: 'destinations',
  loadComponent: () =>
    import('./features/destinations/destinations').then((m) => m.DestinationsComponent),
}
```

Route ist für alle eingeloggten User zugänglich (kein `adminGuard`) —
Admin-Buttons werden im Template per `@if (isAdmin())` gesteuert.

### Sidebar

```typescript
{ label: 'Destinations', icon: '🔗', route: '/destinations' }
```

---

## App Config

```typescript
// app.config.ts
import { destinationsReducer } from './store/destinations/destinations.reducer';
import * as DestinationsEffects from './store/destinations/destinations.effects';

provideStore({ auth: authReducer, docker: dockerReducer, users: usersReducer, destinations: destinationsReducer }),
provideEffects(AuthEffects, DockerEffects, UsersEffects, DestinationsEffects),
```

---

## Phase 2 — Health Check (geplant)

Automatischer Status-Check für jede Destination:

```
Backend: GET /api/destinations/:id/health
  → Backend macht HEAD-Request zur URL
  → Gibt { status: 'online' | 'offline' | 'unknown', latencyMs: number } zurück

Frontend: Status-Badge auf jeder Kachel
  → grüner Punkt = online
  → roter Punkt = offline
  → grauer Punkt = unbekannt (noch nicht geprüft)
  → Auto-Refresh alle 60 Sekunden (NgRx Effect mit timer())
```

Warum Backend-seitig: Wenn WorkSpace2K auf dem Home-Server läuft, fehlen CORS-Header
auf den lokalen Services — Browser-fetch würde fehlschlagen.
Der Backend-Check läuft server-seitig ohne CORS.

---

## Offene Punkte

- [ ] Phase 2: Health Check Backend + Status-Badge Frontend
- [ ] Drag & Drop Sortierung (sortOrder per D&D anpassen)
- [ ] Favicon-Unterstützung (icon als URL statt Emoji)
- [ ] Import aus NPM (Proxy Hosts automatisch einlesen)
